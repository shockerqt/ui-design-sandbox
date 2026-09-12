#!/usr/bin/env python3
"""Validate a GitHub Actions artifact and materialize its bound Sandbox tarball."""

from __future__ import annotations

import argparse
import gzip
import hashlib
import io
import json
import os
import re
import stat
import sys
import tarfile
import tempfile
import zipfile
from pathlib import Path
from typing import Any

HEX_40_RE = re.compile(r"^[0-9a-f]{40}$")
HEX_64_RE = re.compile(r"^[0-9a-f]{64}$")
MAX_ZIP_BYTES = 256 * 1024 * 1024
MAX_TAR_BYTES = 128 * 1024 * 1024
MAX_JSON_BYTES = 16 * 1024
EXPECTED_ZIP_MEMBERS = {
    "package-result.json",
    "artifact/sandbox.tar.gz",
    "artifact/sandbox.tar.gz.sha256",
}


class CandidateError(ValueError):
    """Raised when a delivery candidate is not bound to the expected GitHub run."""


def _positive_int(value: Any, name: str) -> int:
    if isinstance(value, bool):
        raise CandidateError(f"{name} must be a positive integer")
    try:
        parsed = int(value)
    except (TypeError, ValueError) as error:
        raise CandidateError(f"{name} must be a positive integer") from error
    if parsed <= 0 or str(parsed) != str(value):
        raise CandidateError(f"{name} must be a canonical positive integer")
    return parsed


def _load_json(path: Path, name: str) -> dict[str, Any]:
    if not path.is_file() or path.stat().st_size > MAX_JSON_BYTES:
        raise CandidateError(f"{name} is missing or exceeds {MAX_JSON_BYTES} bytes")
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        raise CandidateError(f"{name} is not valid UTF-8 JSON") from error
    if not isinstance(value, dict):
        raise CandidateError(f"{name} must be a JSON object")
    return value


def _hash_file(path: Path, maximum: int, name: str) -> tuple[str, int]:
    digest = hashlib.sha256()
    size = 0
    try:
        with path.open("rb") as stream:
            while chunk := stream.read(65536):
                size += len(chunk)
                if size > maximum:
                    raise CandidateError(f"{name} exceeds {maximum} bytes")
                digest.update(chunk)
    except OSError as error:
        raise CandidateError(f"cannot read {name}") from error
    if size == 0:
        raise CandidateError(f"{name} is empty")
    return digest.hexdigest(), size


def _validate_github_metadata(
    artifact: dict[str, Any],
    run: dict[str, Any],
    *,
    source_sha: str,
    run_id: int,
    run_attempt: int,
    artifact_id: int,
    transport_digest: str,
) -> None:
    if artifact.get("id") != artifact_id or artifact.get("expired") is not False:
        raise CandidateError("artifact identity is absent, expired, or mismatched")
    if artifact.get("name") != f"sandbox-{source_sha}-{run_attempt}":
        raise CandidateError("artifact name does not bind source and run attempt")
    if artifact.get("digest") != f"sha256:{transport_digest}":
        raise CandidateError("GitHub artifact digest does not match the selected transport digest")

    artifact_run = artifact.get("workflow_run")
    if not isinstance(artifact_run, dict):
        raise CandidateError("artifact is missing workflow_run identity")
    if artifact_run.get("id") != run_id or artifact_run.get("head_sha") != source_sha:
        raise CandidateError("artifact workflow_run does not match the selected source/run")

    if run.get("id") != run_id or run.get("run_attempt") != run_attempt:
        raise CandidateError("workflow run ID/attempt mismatch")
    if run.get("head_sha") != source_sha:
        raise CandidateError("workflow run head SHA mismatch")
    if run.get("status") != "completed" or run.get("conclusion") != "success":
        raise CandidateError("workflow run is not a completed success")
    if run.get("path") != ".github/workflows/ci.yml":
        raise CandidateError("artifact was not produced by the allowlisted CI workflow")


def _read_zip_member(archive: zipfile.ZipFile, info: zipfile.ZipInfo, maximum: int) -> bytes:
    if info.flag_bits & 0x1:
        raise CandidateError(f"encrypted ZIP member is forbidden: {info.filename}")
    mode = info.external_attr >> 16
    file_type = stat.S_IFMT(mode)
    if file_type not in (0, stat.S_IFREG):
        raise CandidateError(f"non-regular ZIP member is forbidden: {info.filename}")
    if info.file_size <= 0 or info.file_size > maximum:
        raise CandidateError(f"ZIP member size is invalid: {info.filename}")
    with archive.open(info, "r") as member:
        data = member.read(maximum + 1)
    if len(data) != info.file_size or len(data) > maximum:
        raise CandidateError(f"ZIP member byte count is invalid: {info.filename}")
    return data


def _release_identity(tar_bytes: bytes) -> dict[str, Any]:
    try:
        with gzip.GzipFile(fileobj=io.BytesIO(tar_bytes), mode="rb") as compressed:
            with tarfile.open(fileobj=compressed, mode="r|") as archive:
                release_members = []
                for index, member in enumerate(archive, start=1):
                    if index > 10000:
                        raise CandidateError("inner tar exceeds member limit")
                    if member.name == "release.json":
                        release_members.append(member)
                        if not member.isreg() or member.size <= 0 or member.size > MAX_JSON_BYTES:
                            raise CandidateError("release.json has invalid type or size")
                        stream = archive.extractfile(member)
                        if stream is None:
                            raise CandidateError("release.json cannot be read")
                        raw = stream.read(MAX_JSON_BYTES + 1)
                if len(release_members) != 1:
                    raise CandidateError("inner tar must contain one root release.json")
    except CandidateError:
        raise
    except (OSError, EOFError, tarfile.TarError, gzip.BadGzipFile) as error:
        raise CandidateError("inner tar is invalid") from error

    try:
        value = json.loads(raw.decode("utf-8"))
    except (UnicodeError, json.JSONDecodeError) as error:
        raise CandidateError("release.json is not valid UTF-8 JSON") from error
    if not isinstance(value, dict):
        raise CandidateError("release.json must be a JSON object")
    return value


def verify_candidate(
    *,
    artifact_zip: Path,
    artifact_metadata: Path,
    workflow_run: Path,
    output_archive: Path,
    source_sha: str,
    run_id: int | str,
    run_attempt: int | str,
    artifact_id: int | str,
    transport_digest: str,
    artifact_sha256: str,
) -> dict[str, Any]:
    if not HEX_40_RE.fullmatch(source_sha):
        raise CandidateError("source_sha must be 40 lowercase hexadecimal characters")
    if not HEX_64_RE.fullmatch(transport_digest):
        raise CandidateError("transport_digest must be 64 lowercase hexadecimal characters")
    if not HEX_64_RE.fullmatch(artifact_sha256):
        raise CandidateError("artifact_sha256 must be 64 lowercase hexadecimal characters")
    valid_run_id = _positive_int(run_id, "workflow_run_id")
    valid_attempt = _positive_int(run_attempt, "workflow_run_attempt")
    valid_artifact_id = _positive_int(artifact_id, "artifact_id")

    artifact = _load_json(artifact_metadata, "artifact metadata")
    run = _load_json(workflow_run, "workflow run metadata")
    _validate_github_metadata(
        artifact,
        run,
        source_sha=source_sha,
        run_id=valid_run_id,
        run_attempt=valid_attempt,
        artifact_id=valid_artifact_id,
        transport_digest=transport_digest,
    )

    observed_transport, _ = _hash_file(artifact_zip, MAX_ZIP_BYTES, "artifact ZIP")
    if observed_transport != transport_digest:
        raise CandidateError("downloaded artifact ZIP digest mismatch")

    try:
        with zipfile.ZipFile(artifact_zip, "r") as archive:
            infos = archive.infolist()
            names = [info.filename for info in infos]
            if len(names) != len(set(names)) or set(names) != EXPECTED_ZIP_MEMBERS:
                raise CandidateError("artifact ZIP members do not match the exact allowlist")
            by_name = {info.filename: info for info in infos}
            tar_bytes = _read_zip_member(
                archive, by_name["artifact/sandbox.tar.gz"], MAX_TAR_BYTES
            )
            sidecar = _read_zip_member(
                archive, by_name["artifact/sandbox.tar.gz.sha256"], 256
            )
            package_result_raw = _read_zip_member(
                archive, by_name["package-result.json"], MAX_JSON_BYTES
            )
    except CandidateError:
        raise
    except (OSError, zipfile.BadZipFile, RuntimeError) as error:
        raise CandidateError("artifact ZIP is invalid") from error

    observed_tar = hashlib.sha256(tar_bytes).hexdigest()
    if observed_tar != artifact_sha256 or sidecar != f"{artifact_sha256}\n".encode("ascii"):
        raise CandidateError("inner tar digest or sidecar mismatch")

    try:
        package_result = json.loads(package_result_raw.decode("utf-8"))
    except (UnicodeError, json.JSONDecodeError) as error:
        raise CandidateError("package-result.json is invalid") from error
    if not isinstance(package_result, dict):
        raise CandidateError("package-result.json must be an object")
    if package_result.get("source_sha") != source_sha:
        raise CandidateError("package result source mismatch")
    if package_result.get("artifact_sha256") != artifact_sha256:
        raise CandidateError("package result inner digest mismatch")
    if package_result.get("byte_size") != len(tar_bytes):
        raise CandidateError("package result byte size mismatch")

    release = _release_identity(tar_bytes)
    if release.get("source_sha") != source_sha:
        raise CandidateError("release source mismatch")
    if release.get("workflow_run_id") != valid_run_id:
        raise CandidateError("release workflow run mismatch")
    if release.get("workflow_run_attempt") != valid_attempt:
        raise CandidateError("release workflow attempt mismatch")

    output_archive = output_archive.resolve()
    output_archive.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary_name = tempfile.mkstemp(prefix=f".{output_archive.name}.", dir=output_archive.parent)
    temporary = Path(temporary_name)
    try:
        with os.fdopen(fd, "wb") as output:
            output.write(tar_bytes)
            output.flush()
            os.fsync(output.fileno())
        os.chmod(temporary, 0o600)
        os.replace(temporary, output_archive)
    finally:
        if temporary.exists():
            temporary.unlink()

    return {
        "status": "ok",
        "source_sha": source_sha,
        "workflow_run_id": valid_run_id,
        "workflow_run_attempt": valid_attempt,
        "artifact_id": valid_artifact_id,
        "transport_digest": transport_digest,
        "artifact_sha256": artifact_sha256,
        "byte_size": len(tar_bytes),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--artifact-zip", required=True, type=Path)
    parser.add_argument("--artifact-metadata", required=True, type=Path)
    parser.add_argument("--workflow-run", required=True, type=Path)
    parser.add_argument("--output-archive", required=True, type=Path)
    parser.add_argument("--source-sha", required=True)
    parser.add_argument("--workflow-run-id", required=True)
    parser.add_argument("--workflow-run-attempt", required=True)
    parser.add_argument("--artifact-id", required=True)
    parser.add_argument("--transport-digest", required=True)
    parser.add_argument("--artifact-sha256", required=True)
    args = parser.parse_args()

    try:
        result = verify_candidate(
            artifact_zip=args.artifact_zip,
            artifact_metadata=args.artifact_metadata,
            workflow_run=args.workflow_run,
            output_archive=args.output_archive,
            source_sha=args.source_sha,
            run_id=args.workflow_run_id,
            run_attempt=args.workflow_run_attempt,
            artifact_id=args.artifact_id,
            transport_digest=args.transport_digest,
            artifact_sha256=args.artifact_sha256,
        )
    except CandidateError as error:
        print(json.dumps({"status": "error", "message": str(error)}, sort_keys=True))
        return 1
    print(json.dumps(result, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
