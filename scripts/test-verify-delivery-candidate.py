#!/usr/bin/env python3
"""Tests for GitHub artifact identity and transport verification."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import tempfile
import unittest
import zipfile
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent


def _load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


package_module = _load("package_artifact", SCRIPT_DIR / "package-artifact.py")
verify_module = _load("verify_delivery_candidate", SCRIPT_DIR / "verify-delivery-candidate.py")

CandidateError = verify_module.CandidateError
verify_candidate = verify_module.verify_candidate

SOURCE = "1e18ed03b8dc06a888eec2e0f920f7bb1f986330"
RUN_ID = 33953162824
ATTEMPT = 1
ARTIFACT_ID = 9965486277


class CandidateFixture:
    def __init__(self, root: Path) -> None:
        self.root = root
        self.dist = root / "dist"
        assets = self.dist / "assets"
        assets.mkdir(parents=True)
        (self.dist / "index.html").write_text(
            f'<script src="/releases/{SOURCE}/assets/app.js"></script>',
            encoding="utf-8",
        )
        (assets / "app.js").write_text("console.log('ok')", encoding="utf-8")

        self.tar_path = root / "sandbox.tar.gz"
        self.package_result = package_module.package_artifact(
            self.dist,
            self.tar_path,
            SOURCE,
            RUN_ID,
            ATTEMPT,
        )
        self.inner_digest = self.package_result["artifact_sha256"]
        self.zip_path = root / "artifact.zip"
        self._write_zip()
        self.transport_digest = hashlib.sha256(self.zip_path.read_bytes()).hexdigest()

        self.artifact_metadata_path = root / "artifact-metadata.json"
        self.run_path = root / "workflow-run.json"
        self._write_metadata()

    def _write_zip(self, *, extra_name: str | None = None) -> None:
        with zipfile.ZipFile(self.zip_path, "w", compression=zipfile.ZIP_STORED) as archive:
            archive.write(self.tar_path, "artifact/sandbox.tar.gz")
            archive.writestr("artifact/sandbox.tar.gz.sha256", f"{self.inner_digest}\n")
            archive.writestr("package-result.json", json.dumps(self.package_result))
            if extra_name is not None:
                archive.writestr(extra_name, "extra")

    def _write_metadata(self) -> None:
        artifact = {
            "id": ARTIFACT_ID,
            "name": f"sandbox-{SOURCE}-{ATTEMPT}",
            "expired": False,
            "digest": f"sha256:{self.transport_digest}",
            "workflow_run": {"id": RUN_ID, "head_sha": SOURCE},
        }
        run = {
            "id": RUN_ID,
            "run_attempt": ATTEMPT,
            "head_sha": SOURCE,
            "status": "completed",
            "conclusion": "success",
            "path": ".github/workflows/ci.yml",
        }
        self.artifact_metadata_path.write_text(json.dumps(artifact), encoding="utf-8")
        self.run_path.write_text(json.dumps(run), encoding="utf-8")

    def verify(self, **overrides):
        values = {
            "artifact_zip": self.zip_path,
            "artifact_metadata": self.artifact_metadata_path,
            "workflow_run": self.run_path,
            "output_archive": self.root / "verified.tar.gz",
            "source_sha": SOURCE,
            "run_id": RUN_ID,
            "run_attempt": ATTEMPT,
            "artifact_id": ARTIFACT_ID,
            "transport_digest": self.transport_digest,
            "artifact_sha256": self.inner_digest,
        }
        values.update(overrides)
        return verify_candidate(**values)


class VerifyDeliveryCandidateTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.fixture = CandidateFixture(Path(self.temporary.name))

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def test_accepts_exact_bound_candidate(self) -> None:
        result = self.fixture.verify()
        output = Path(self.temporary.name) / "verified.tar.gz"
        self.assertEqual(result["status"], "ok")
        self.assertEqual(result["artifact_id"], ARTIFACT_ID)
        self.assertEqual(hashlib.sha256(output.read_bytes()).hexdigest(), self.fixture.inner_digest)
        self.assertEqual(output.stat().st_mode & 0o777, 0o600)

    def test_rejects_downloaded_transport_mismatch(self) -> None:
        self.fixture.zip_path.write_bytes(self.fixture.zip_path.read_bytes() + b"tamper")
        with self.assertRaisesRegex(CandidateError, "downloaded artifact ZIP digest mismatch"):
            self.fixture.verify()

    def test_rejects_github_artifact_identity_mismatch(self) -> None:
        data = json.loads(self.fixture.artifact_metadata_path.read_text(encoding="utf-8"))
        data["id"] = ARTIFACT_ID + 1
        self.fixture.artifact_metadata_path.write_text(json.dumps(data), encoding="utf-8")
        with self.assertRaisesRegex(CandidateError, "artifact identity"):
            self.fixture.verify()

    def test_rejects_unsuccessful_or_wrong_workflow(self) -> None:
        for field, value, message in (
            ("conclusion", "failure", "completed success"),
            ("path", ".github/workflows/other.yml", "allowlisted CI workflow"),
        ):
            with self.subTest(field=field):
                self.fixture._write_metadata()
                data = json.loads(self.fixture.run_path.read_text(encoding="utf-8"))
                data[field] = value
                self.fixture.run_path.write_text(json.dumps(data), encoding="utf-8")
                with self.assertRaisesRegex(CandidateError, message):
                    self.fixture.verify()

    def test_rejects_extra_zip_member(self) -> None:
        self.fixture._write_zip(extra_name="unexpected.txt")
        self.fixture.transport_digest = hashlib.sha256(self.fixture.zip_path.read_bytes()).hexdigest()
        self.fixture._write_metadata()
        with self.assertRaisesRegex(CandidateError, "exact allowlist"):
            self.fixture.verify()

    def test_rejects_inner_digest_or_sidecar_mismatch(self) -> None:
        with zipfile.ZipFile(self.fixture.zip_path, "w", compression=zipfile.ZIP_STORED) as archive:
            archive.write(self.fixture.tar_path, "artifact/sandbox.tar.gz")
            archive.writestr("artifact/sandbox.tar.gz.sha256", f"{'f' * 64}\n")
            archive.writestr("package-result.json", json.dumps(self.fixture.package_result))
        self.fixture.transport_digest = hashlib.sha256(self.fixture.zip_path.read_bytes()).hexdigest()
        self.fixture._write_metadata()
        with self.assertRaisesRegex(CandidateError, "inner tar digest or sidecar mismatch"):
            self.fixture.verify()

    def test_rejects_release_run_binding_mismatch(self) -> None:
        bad_tar = Path(self.temporary.name) / "bad.tar.gz"
        package_module.package_artifact(self.fixture.dist, bad_tar, SOURCE, RUN_ID + 1, ATTEMPT)
        self.fixture.tar_path = bad_tar
        self.fixture.package_result["artifact_sha256"] = hashlib.sha256(bad_tar.read_bytes()).hexdigest()
        self.fixture.package_result["byte_size"] = bad_tar.stat().st_size
        self.fixture.package_result["size_bytes"] = bad_tar.stat().st_size
        self.fixture.inner_digest = self.fixture.package_result["artifact_sha256"]
        self.fixture._write_zip()
        self.fixture.transport_digest = hashlib.sha256(self.fixture.zip_path.read_bytes()).hexdigest()
        self.fixture._write_metadata()
        with self.assertRaisesRegex(CandidateError, "release workflow run mismatch"):
            self.fixture.verify()

    def test_rejects_noncanonical_numeric_inputs(self) -> None:
        for field in ("run_id", "run_attempt", "artifact_id"):
            with self.subTest(field=field):
                with self.assertRaisesRegex(CandidateError, "canonical positive integer"):
                    self.fixture.verify(**{field: f"0{RUN_ID}"})


if __name__ == "__main__":
    unittest.main()
