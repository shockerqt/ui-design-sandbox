#!/usr/bin/env python3
"""Deterministic tar.gz packaging for dist directory artifacts."""

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
from pathlib import Path
from typing import Any, Dict, List, Tuple

MAX_MEMBERS = 10000
MAX_PAYLOAD_BYTES = 128 * 1024 * 1024  # 128 MiB


def _validate_positive_int(value: Any, name: str) -> int:
    if isinstance(value, bool):
        raise ValueError(f"{name} must be a positive integer, got boolean: {value}")
    if isinstance(value, int):
        if value <= 0:
            raise ValueError(f"{name} must be positive, got: {value}")
        return value
    if isinstance(value, str):
        if not re.fullmatch(r"[1-9][0-9]*", value):
            raise ValueError(f"{name} must be a positive integer string, got: {value!r}")
        return int(value)
    raise TypeError(f"{name} must be an integer or integer string, got: {type(value).__name__}")


def _validate_source_sha(value: Any) -> str:
    if not isinstance(value, str):
        raise TypeError(f"source_sha must be a string, got {type(value).__name__}")
    if not re.fullmatch(r"[0-9a-f]{40}", value):
        raise ValueError(f"source_sha must be a 40-character lowercase hex string, got {value!r}")
    return value


def _validate_member_name(rel_posix: str, name: str, parts: Tuple[str, ...]) -> None:
    if "\\" in rel_posix or "\\" in name:
        raise ValueError(f"Backslash is not permitted in member path: {rel_posix!r}")
    if any(ord(c) < 32 or ord(c) == 127 for c in rel_posix):
        raise ValueError(f"Control characters are not permitted in member path: {rel_posix!r}")
    if any(part in (".", "..") for part in parts):
        raise ValueError(f"Relative member path cannot contain '.' or '..' components: {rel_posix!r}")
    if any(part == "" for part in parts):
        raise ValueError(f"Empty path components are not permitted: {rel_posix!r}")
    if name in ("release.json", ".artifact-sha256"):
        raise ValueError(f"Reserved metadata file {name!r} is not permitted in dist: {rel_posix!r}")


def package_artifact(
    dist: str | Path,
    output: str | Path,
    source_sha: str,
    workflow_run_id: int | str,
    workflow_run_attempt: int | str,
) -> Dict[str, Any]:
    """Package an already-built dist directory into a deterministic tar.gz archive.

    Returns metadata dict containing:
      - source_sha
      - artifact_sha256
      - byte_size (and size_bytes alias)
    """
    valid_source_sha = _validate_source_sha(source_sha)
    valid_run_id = _validate_positive_int(workflow_run_id, "workflow_run_id")
    valid_run_attempt = _validate_positive_int(workflow_run_attempt, "workflow_run_attempt")

    dist_path = Path(dist)
    if not dist_path.exists():
        raise ValueError(f"dist directory does not exist: {dist_path}")
    if dist_path.is_symlink():
        raise ValueError(f"dist path must not be a symlink: {dist_path}")
    if not dist_path.is_dir():
        raise ValueError(f"dist path must be a directory: {dist_path}")

    # Validate dist/index.html
    index_html = dist_path / "index.html"
    if not index_html.exists():
        raise ValueError("dist/index.html is required but does not exist")
    if index_html.is_symlink():
        raise ValueError("dist/index.html must not be a symlink")
    if not index_html.is_file():
        raise ValueError("dist/index.html must be a regular file")

    # Collect members from dist
    dist_members: List[Tuple[str, Path, bool, int]] = []
    # tuple: (rel_posix, abs_path, is_dir, file_size)

    def _walk_dist(current_dir: Path, rel_base: Path) -> None:
        try:
            entry_names = sorted(os.listdir(current_dir))
        except OSError as err:
            raise ValueError(f"Failed to read directory {current_dir}: {err}") from err

        for name in entry_names:
            if name in (".", ".."):
                continue
            child_abs = current_dir / name
            child_rel = rel_base / name if rel_base != Path(".") else Path(name)
            rel_posix = child_rel.as_posix()

            _validate_member_name(rel_posix, name, child_rel.parts)

            st = os.lstat(child_abs)
            if stat.S_ISLNK(st.st_mode):
                raise ValueError(f"Symlinks are not permitted in dist: {rel_posix}")

            if stat.S_ISDIR(st.st_mode):
                dist_members.append((rel_posix, child_abs, True, 0))
                _walk_dist(child_abs, child_rel)
            elif stat.S_ISREG(st.st_mode):
                dist_members.append((rel_posix, child_abs, False, st.st_size))
            else:
                raise ValueError(f"Special files are not permitted in dist: {rel_posix}")

    _walk_dist(dist_path, Path("."))

    # Sort all dist members deterministically by relative posix path
    dist_members.sort(key=lambda m: m[0])

    # Generate root release.json
    release_data = {
        "schema_version": 1,
        "source_sha": valid_source_sha,
        "workflow_run_id": valid_run_id,
        "workflow_run_attempt": valid_run_attempt,
    }
    release_bytes = (json.dumps(release_data, indent=2, sort_keys=True) + "\n").encode("utf-8")

    # Verify limits
    total_members = 1 + len(dist_members)  # release.json + dist members
    if total_members > MAX_MEMBERS:
        raise ValueError(f"Member count exceeds maximum limit of {MAX_MEMBERS}: {total_members}")

    total_payload = len(release_bytes) + sum(m[3] for m in dist_members)
    if total_payload > MAX_PAYLOAD_BYTES:
        raise ValueError(f"Payload size exceeds maximum limit of {MAX_PAYLOAD_BYTES} bytes: {total_payload} bytes")

    output_path = Path(output)
    output_resolved = output_path.resolve()
    dist_resolved = dist_path.resolve()
    if output_resolved == dist_resolved or dist_resolved in output_resolved.parents:
        raise ValueError("Artifact output must be outside dist")
    sidecar_resolved = output_path.with_suffix(output_path.suffix + ".sha256").resolve()
    if sidecar_resolved == dist_resolved or dist_resolved in sidecar_resolved.parents:
        raise ValueError("Artifact sidecar must be outside dist")
    output_resolved.parent.mkdir(parents=True, exist_ok=True)

    # Write complete archive via temp sibling
    temp_fd, temp_file_str = tempfile.mkstemp(
        prefix=f".{output_resolved.name}.tmp.",
        dir=output_resolved.parent,
    )
    temp_path = Path(temp_file_str)

    try:
        with os.fdopen(temp_fd, "wb") as f_out:
            # Deterministic gzip: mtime=0.0, empty filename
            with gzip.GzipFile(filename="", mode="wb", fileobj=f_out, mtime=0.0) as gz_out:
                with tarfile.open(mode="w", fileobj=gz_out, format=tarfile.PAX_FORMAT) as tar:
                    # 1. release.json at root
                    rel_info = tarfile.TarInfo(name="release.json")
                    rel_info.type = tarfile.REGTYPE
                    rel_info.mode = 0o644
                    rel_info.mtime = 0
                    rel_info.uid = 0
                    rel_info.gid = 0
                    rel_info.uname = ""
                    rel_info.gname = ""
                    rel_info.size = len(release_bytes)
                    tar.addfile(rel_info, fileobj=io.BytesIO(release_bytes))

                    # 2. dist members
                    for rel_posix, abs_path, is_dir, file_size in dist_members:
                        info = tarfile.TarInfo(name=rel_posix)
                        info.mtime = 0
                        info.uid = 0
                        info.gid = 0
                        info.uname = ""
                        info.gname = ""
                        if is_dir:
                            info.type = tarfile.DIRTYPE
                            info.mode = 0o755
                            info.size = 0
                            tar.addfile(info)
                        else:
                            info.type = tarfile.REGTYPE
                            info.mode = 0o644
                            info.size = file_size
                            with open(abs_path, "rb") as f_in:
                                tar.addfile(info, fileobj=f_in)

        # Calculate SHA256 of actual compressed archive bytes
        hasher = hashlib.sha256()
        with open(temp_path, "rb") as f_in:
            while chunk := f_in.read(65536):
                hasher.update(chunk)
        artifact_sha256 = hasher.hexdigest()
        byte_size = temp_path.stat().st_size

        os.chmod(temp_path, 0o644)
        os.replace(temp_path, output_resolved)
    finally:
        if temp_path.exists():
            temp_path.unlink()

    # Write sidecar output.with_suffix(output.suffix + ".sha256")
    sidecar_path = output_path.with_suffix(output_path.suffix + ".sha256").resolve()
    sidecar_fd, sidecar_temp_str = tempfile.mkstemp(
        prefix=f".{sidecar_path.name}.tmp.",
        dir=sidecar_path.parent,
    )
    sidecar_temp = Path(sidecar_temp_str)
    try:
        with os.fdopen(sidecar_fd, "w", encoding="utf-8") as sf:
            sf.write(f"{artifact_sha256}\n")
        os.chmod(sidecar_temp, 0o644)
        os.replace(sidecar_temp, sidecar_path)
    finally:
        if sidecar_temp.exists():
            sidecar_temp.unlink()

    return {
        "source_sha": valid_source_sha,
        "artifact_sha256": artifact_sha256,
        "byte_size": byte_size,
        "size_bytes": byte_size,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Deterministic tar.gz packaging for dist directory artifacts",
    )
    parser.add_argument(
        "--dist",
        type=Path,
        required=True,
        help="Path to dist directory",
    )
    parser.add_argument(
        "--output",
        type=Path,
        required=True,
        help="Path to output archive (.tar.gz)",
    )
    parser.add_argument(
        "--source-sha",
        type=str,
        required=True,
        help="Git source SHA (40 lowercase hex characters)",
    )
    parser.add_argument(
        "--workflow-run-id",
        type=str,
        required=True,
        help="Workflow run ID (positive integer)",
    )
    parser.add_argument(
        "--workflow-run-attempt",
        type=str,
        required=True,
        help="Workflow run attempt (positive integer)",
    )

    args = parser.parse_args()

    try:
        result = package_artifact(
            dist=args.dist,
            output=args.output,
            source_sha=args.source_sha,
            workflow_run_id=args.workflow_run_id,
            workflow_run_attempt=args.workflow_run_attempt,
        )
        print(json.dumps(result, indent=2))
    except Exception as exc:
        sys.stderr.write(f"Error: {exc}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
