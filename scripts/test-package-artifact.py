#!/usr/bin/env python3
"""Comprehensive test suite for package-artifact.py."""

import hashlib
import json
import os
import shutil
import stat
import subprocess
import sys
import tarfile
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

# Import package_artifact from scripts.package-artifact
SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

import importlib.util

spec = importlib.util.spec_from_file_location("package_artifact_module", SCRIPT_DIR / "package-artifact.py")
package_mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(package_mod)
package_artifact = package_mod.package_artifact


class TestPackageArtifact(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.mkdtemp()
        self.dist_dir = Path(self.temp_dir) / "dist"
        self.dist_dir.mkdir(parents=True, exist_ok=True)

        # Populate a minimal valid dist fixture
        self.index_html = self.dist_dir / "index.html"
        self.index_html.write_text("<!doctype html><html><body><h1>Sandbox</h1></body></html>", encoding="utf-8")

        self.assets_dir = self.dist_dir / "assets"
        self.assets_dir.mkdir()
        self.app_js = self.assets_dir / "app.js"
        self.app_js.write_text("console.log('sandbox');", encoding="utf-8")
        self.app_css = self.assets_dir / "style.css"
        self.app_css.write_text("body { margin: 0; }", encoding="utf-8")

        self.source_sha = "a" * 40
        self.workflow_run_id = 123456
        self.workflow_run_attempt = 1

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_output_cannot_modify_dist(self) -> None:
        before = sorted(path.relative_to(self.dist_dir) for path in self.dist_dir.rglob("*"))
        with self.assertRaisesRegex(ValueError, "outside dist"):
            package_artifact(self.dist_dir, self.dist_dir / "sandbox.tar.gz", self.source_sha, self.workflow_run_id, self.workflow_run_attempt)
        self.assertEqual(before, sorted(path.relative_to(self.dist_dir) for path in self.dist_dir.rglob("*")))

    def test_expected_bytes_and_metadata(self) -> None:
        output_path = Path(self.temp_dir) / "output" / "sandbox.tar.gz"
        result = package_artifact(
            dist=self.dist_dir,
            output=output_path,
            source_sha=self.source_sha,
            workflow_run_id=self.workflow_run_id,
            workflow_run_attempt=self.workflow_run_attempt,
        )

        self.assertTrue(output_path.exists())
        self.assertEqual(result["source_sha"], self.source_sha)
        self.assertEqual(result["byte_size"], output_path.stat().st_size)
        self.assertEqual(result["size_bytes"], output_path.stat().st_size)

        # Verify sidecar file
        sidecar_path = output_path.with_suffix(output_path.suffix + ".sha256")
        self.assertTrue(sidecar_path.exists())
        sidecar_content = sidecar_path.read_text(encoding="utf-8")
        self.assertEqual(sidecar_content, f"{result['artifact_sha256']}\n")

        # Verify archive digest
        hasher = hashlib.sha256()
        hasher.update(output_path.read_bytes())
        self.assertEqual(hasher.hexdigest(), result["artifact_sha256"])

        # Verify deterministic gzip header (RFC 1952)
        raw_bytes = output_path.read_bytes()
        self.assertEqual(raw_bytes[:2], b"\x1f\x8b")  # gzip magic
        self.assertEqual(raw_bytes[2], 8)  # deflate
        self.assertEqual(raw_bytes[3] & 0b00001000, 0)  # FNAME bit must not be set (empty filename)
        self.assertEqual(raw_bytes[4:8], b"\x00\x00\x00\x00")  # mtime must be 0

        # Inspect tar contents
        with tarfile.open(output_path, "r:gz") as tar:
            members = tar.getmembers()
            member_names = [m.name for m in members]

            # release.json should be at root and first member
            self.assertEqual(member_names[0], "release.json")
            self.assertIn("assets", member_names)
            self.assertIn("assets/app.js", member_names)
            self.assertIn("assets/style.css", member_names)
            self.assertIn("index.html", member_names)

            # No leading ./ or root directory entry
            for name in member_names:
                self.assertFalse(name.startswith("./"))
                self.assertFalse(name.startswith("/"))
                self.assertNotEqual(name, ".")
                self.assertNotEqual(name, "dist")

            # Check release.json properties and content
            rel_member = members[0]
            self.assertTrue(rel_member.isreg())
            self.assertEqual(rel_member.mode, 0o644)
            self.assertEqual(rel_member.mtime, 0)
            self.assertEqual(rel_member.uid, 0)
            self.assertEqual(rel_member.gid, 0)
            self.assertEqual(rel_member.uname, "")
            self.assertEqual(rel_member.gname, "")

            rel_file = tar.extractfile(rel_member)
            self.assertIsNotNone(rel_file)
            rel_data = json.loads(rel_file.read().decode("utf-8"))
            self.assertEqual(
                rel_data,
                {
                    "schema_version": 1,
                    "source_sha": self.source_sha,
                    "workflow_run_id": self.workflow_run_id,
                    "workflow_run_attempt": self.workflow_run_attempt,
                },
            )
            # No digest inside archive
            self.assertNotIn("artifact_sha256", rel_data)

            # Check normalized modes and ownership for all members
            for m in members:
                self.assertEqual(m.mtime, 0)
                self.assertEqual(m.uid, 0)
                self.assertEqual(m.gid, 0)
                self.assertEqual(m.uname, "")
                self.assertEqual(m.gname, "")
                if m.isdir():
                    self.assertEqual(m.mode, 0o755)
                elif m.isreg():
                    self.assertEqual(m.mode, 0o644)

    def test_two_outputs_equal_bytes_and_digest(self) -> None:
        out1 = Path(self.temp_dir) / "run1.tar.gz"
        out2 = Path(self.temp_dir) / "run2.tar.gz"

        meta1 = package_artifact(self.dist_dir, out1, self.source_sha, self.workflow_run_id, self.workflow_run_attempt)
        meta2 = package_artifact(self.dist_dir, out2, self.source_sha, self.workflow_run_id, self.workflow_run_attempt)

        self.assertEqual(out1.read_bytes(), out2.read_bytes())
        self.assertEqual(meta1["artifact_sha256"], meta2["artifact_sha256"])
        self.assertEqual(meta1["byte_size"], meta2["byte_size"])

        sidecar1 = out1.with_suffix(out1.suffix + ".sha256").read_text(encoding="utf-8")
        sidecar2 = out2.with_suffix(out2.suffix + ".sha256").read_text(encoding="utf-8")
        self.assertEqual(sidecar1, sidecar2)

    def test_changed_source_changes_artifact(self) -> None:
        base_out = Path(self.temp_dir) / "base.tar.gz"
        base_meta = package_artifact(self.dist_dir, base_out, self.source_sha, self.workflow_run_id, self.workflow_run_attempt)

        # 1. Changed source_sha
        sha_out = Path(self.temp_dir) / "diff_sha.tar.gz"
        other_sha = "b" * 40
        sha_meta = package_artifact(self.dist_dir, sha_out, other_sha, self.workflow_run_id, self.workflow_run_attempt)
        self.assertNotEqual(base_meta["artifact_sha256"], sha_meta["artifact_sha256"])
        self.assertNotEqual(base_out.read_bytes(), sha_out.read_bytes())

        # 2. Changed workflow_run_id
        run_out = Path(self.temp_dir) / "diff_run.tar.gz"
        run_meta = package_artifact(self.dist_dir, run_out, self.source_sha, self.workflow_run_id + 1, self.workflow_run_attempt)
        self.assertNotEqual(base_meta["artifact_sha256"], run_meta["artifact_sha256"])

        # 3. Changed workflow_run_attempt
        attempt_out = Path(self.temp_dir) / "diff_attempt.tar.gz"
        attempt_meta = package_artifact(self.dist_dir, attempt_out, self.source_sha, self.workflow_run_id, self.workflow_run_attempt + 1)
        self.assertNotEqual(base_meta["artifact_sha256"], attempt_meta["artifact_sha256"])

        # 4. Changed payload file in dist
        self.app_js.write_text("console.log('different');", encoding="utf-8")
        payload_out = Path(self.temp_dir) / "diff_payload.tar.gz"
        payload_meta = package_artifact(self.dist_dir, payload_out, self.source_sha, self.workflow_run_id, self.workflow_run_attempt)
        self.assertNotEqual(base_meta["artifact_sha256"], payload_meta["artifact_sha256"])

    def test_symlinks_rejected(self) -> None:
        out = Path(self.temp_dir) / "out.tar.gz"

        # Symlink file in dist
        symlink_file = self.dist_dir / "symlink_file.js"
        symlink_file.symlink_to(self.app_js)
        with self.assertRaises(ValueError) as ctx:
            package_artifact(self.dist_dir, out, self.source_sha, self.workflow_run_id, self.workflow_run_attempt)
        self.assertIn("Symlinks are not permitted", str(ctx.exception))
        symlink_file.unlink()

        # Symlink directory in dist
        symlink_dir = self.dist_dir / "symlink_dir"
        symlink_dir.symlink_to(self.assets_dir)
        with self.assertRaises(ValueError) as ctx:
            package_artifact(self.dist_dir, out, self.source_sha, self.workflow_run_id, self.workflow_run_attempt)
        self.assertIn("Symlinks are not permitted", str(ctx.exception))
        symlink_dir.unlink()

        # Symlinked index.html
        self.index_html.unlink()
        real_index = Path(self.temp_dir) / "real_index.html"
        real_index.write_text("<html></html>", encoding="utf-8")
        self.index_html.symlink_to(real_index)
        with self.assertRaises(ValueError) as ctx:
            package_artifact(self.dist_dir, out, self.source_sha, self.workflow_run_id, self.workflow_run_attempt)
        self.assertIn("index.html must not be a symlink", str(ctx.exception))
        self.index_html.unlink()
        self.index_html.write_text("<html></html>", encoding="utf-8")

        # Symlinked dist path itself
        dist_link = Path(self.temp_dir) / "dist_symlink"
        dist_link.symlink_to(self.dist_dir)
        with self.assertRaises(ValueError) as ctx:
            package_artifact(dist_link, out, self.source_sha, self.workflow_run_id, self.workflow_run_attempt)
        self.assertIn("dist path must not be a symlink", str(ctx.exception))

    def test_reserved_metadata_refused(self) -> None:
        out = Path(self.temp_dir) / "out.tar.gz"

        # release.json in dist root
        rel_json = self.dist_dir / "release.json"
        rel_json.write_text("{}", encoding="utf-8")
        with self.assertRaises(ValueError) as ctx:
            package_artifact(self.dist_dir, out, self.source_sha, self.workflow_run_id, self.workflow_run_attempt)
        self.assertIn("Reserved metadata file", str(ctx.exception))
        rel_json.unlink()

        # .artifact-sha256 in dist root
        art_sha = self.dist_dir / ".artifact-sha256"
        art_sha.write_text("sha", encoding="utf-8")
        with self.assertRaises(ValueError) as ctx:
            package_artifact(self.dist_dir, out, self.source_sha, self.workflow_run_id, self.workflow_run_attempt)
        self.assertIn("Reserved metadata file", str(ctx.exception))
        art_sha.unlink()

        # Nested release.json
        nested_rel = self.assets_dir / "release.json"
        nested_rel.write_text("{}", encoding="utf-8")
        with self.assertRaises(ValueError) as ctx:
            package_artifact(self.dist_dir, out, self.source_sha, self.workflow_run_id, self.workflow_run_attempt)
        self.assertIn("Reserved metadata file", str(ctx.exception))
        nested_rel.unlink()

        # Nested .artifact-sha256
        nested_sha = self.assets_dir / ".artifact-sha256"
        nested_sha.write_text("sha", encoding="utf-8")
        with self.assertRaises(ValueError) as ctx:
            package_artifact(self.dist_dir, out, self.source_sha, self.workflow_run_id, self.workflow_run_attempt)
        self.assertIn("Reserved metadata file", str(ctx.exception))
        nested_sha.unlink()

    def test_invalid_source_and_run_ids(self) -> None:
        out = Path(self.temp_dir) / "out.tar.gz"

        # Invalid source_sha cases
        invalid_shas = [
            "A" * 40,  # uppercase
            "a" * 39,  # too short
            "a" * 41,  # too long
            "g" * 40,  # non-hex
            "",
            "not-a-sha",
        ]
        for bad_sha in invalid_shas:
            with self.subTest(bad_sha=bad_sha):
                with self.assertRaises(ValueError):
                    package_artifact(self.dist_dir, out, bad_sha, self.workflow_run_id, self.workflow_run_attempt)

        with self.assertRaises(TypeError):
            package_artifact(self.dist_dir, out, 12345, self.workflow_run_id, self.workflow_run_attempt)  # type: ignore

        # Invalid workflow_run_id cases
        invalid_run_ids = [0, -1, -999, "0", "-1", "abc", "0123", True, False]
        for bad_id in invalid_run_ids:
            with self.subTest(bad_id=bad_id):
                with self.assertRaises(ValueError):
                    package_artifact(self.dist_dir, out, self.source_sha, bad_id, self.workflow_run_attempt)

        # Invalid workflow_run_attempt cases
        invalid_attempts = [0, -1, -5, "0", "-2", "xyz", True, False]
        for bad_att in invalid_attempts:
            with self.subTest(bad_att=bad_att):
                with self.assertRaises(ValueError):
                    package_artifact(self.dist_dir, out, self.source_sha, self.workflow_run_id, bad_att)

    def test_missing_or_invalid_index_html(self) -> None:
        out = Path(self.temp_dir) / "out.tar.gz"

        # Missing index.html
        self.index_html.unlink()
        with self.assertRaises(ValueError) as ctx:
            package_artifact(self.dist_dir, out, self.source_sha, self.workflow_run_id, self.workflow_run_attempt)
        self.assertIn("dist/index.html is required", str(ctx.exception))

        # index.html is a directory
        self.index_html.mkdir()
        with self.assertRaises(ValueError) as ctx:
            package_artifact(self.dist_dir, out, self.source_sha, self.workflow_run_id, self.workflow_run_attempt)
        self.assertIn("dist/index.html must be a regular file", str(ctx.exception))

    def test_invalid_member_names(self) -> None:
        out = Path(self.temp_dir) / "out.tar.gz"

        # Control character in member name
        bad_file = self.dist_dir / "bad\x07name.txt"
        try:
            bad_file.write_text("bad", encoding="utf-8")
            with self.assertRaises(ValueError) as ctx:
                package_artifact(self.dist_dir, out, self.source_sha, self.workflow_run_id, self.workflow_run_attempt)
            self.assertIn("Control characters are not permitted", str(ctx.exception))
        finally:
            if bad_file.exists():
                bad_file.unlink()

        # Backslash in member name
        bad_bs = self.dist_dir / "bad\\name.txt"
        try:
            bad_bs.write_text("bad", encoding="utf-8")
            with self.assertRaises(ValueError) as ctx:
                package_artifact(self.dist_dir, out, self.source_sha, self.workflow_run_id, self.workflow_run_attempt)
            self.assertIn("Backslash is not permitted", str(ctx.exception))
        finally:
            if bad_bs.exists():
                bad_bs.unlink()

    def test_mode_normalization(self) -> None:
        out = Path(self.temp_dir) / "out.tar.gz"

        # Set unusual filesystem permissions
        os.chmod(self.index_html, 0o777)
        os.chmod(self.app_js, 0o600)
        os.chmod(self.app_css, 0o700)
        os.chmod(self.assets_dir, 0o700)

        package_artifact(self.dist_dir, out, self.source_sha, self.workflow_run_id, self.workflow_run_attempt)

        with tarfile.open(out, "r:gz") as tar:
            for m in tar.getmembers():
                if m.isdir():
                    self.assertEqual(m.mode, 0o755, f"Directory {m.name} mode is not 0755")
                elif m.isreg():
                    self.assertEqual(m.mode, 0o644, f"File {m.name} mode is not 0644")

    def test_no_dist_mutation(self) -> None:
        out = Path(self.temp_dir) / "out.tar.gz"

        # Snapshot dist state
        def snapshot_dir(d: Path) -> dict:
            snapshot = {}
            for root, dirs, files in os.walk(d):
                for f in files:
                    p = Path(root) / f
                    rel = p.relative_to(d).as_posix()
                    st = p.stat()
                    snapshot[rel] = {
                        "size": st.st_size,
                        "mtime": st.st_mtime_ns,
                        "mode": st.st_mode,
                        "sha256": hashlib.sha256(p.read_bytes()).hexdigest(),
                    }
                for sub in dirs:
                    p = Path(root) / sub
                    rel = p.relative_to(d).as_posix()
                    st = p.stat()
                    snapshot[rel] = {
                        "is_dir": True,
                        "mode": st.st_mode,
                    }
            return snapshot

        before_snapshot = snapshot_dir(self.dist_dir)

        package_artifact(self.dist_dir, out, self.source_sha, self.workflow_run_id, self.workflow_run_attempt)

        after_snapshot = snapshot_dir(self.dist_dir)
        self.assertEqual(before_snapshot, after_snapshot)
        self.assertFalse((self.dist_dir / "release.json").exists())
        self.assertFalse((self.dist_dir / ".artifact-sha256").exists())

    def test_limits_enforced(self) -> None:
        out = Path(self.temp_dir) / "out.tar.gz"

        # Exceed member limit
        with patch.object(package_mod, "MAX_MEMBERS", 2):
            with self.assertRaises(ValueError) as ctx:
                package_artifact(self.dist_dir, out, self.source_sha, self.workflow_run_id, self.workflow_run_attempt)
            self.assertIn("Member count exceeds maximum limit", str(ctx.exception))

        # Exceed payload limit
        with patch.object(package_mod, "MAX_PAYLOAD_BYTES", 10):
            with self.assertRaises(ValueError) as ctx:
                package_artifact(self.dist_dir, out, self.source_sha, self.workflow_run_id, self.workflow_run_attempt)
            self.assertIn("Payload size exceeds maximum limit", str(ctx.exception))

    def test_cli_execution(self) -> None:
        out = Path(self.temp_dir) / "cli_out.tar.gz"
        cli_script = SCRIPT_DIR / "package-artifact.py"

        # Successful CLI call
        cmd = [
            sys.executable,
            str(cli_script),
            "--dist",
            str(self.dist_dir),
            "--output",
            str(out),
            "--source-sha",
            self.source_sha,
            "--workflow-run-id",
            str(self.workflow_run_id),
            "--workflow-run-attempt",
            str(self.workflow_run_attempt),
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        self.assertEqual(res.returncode, 0, f"CLI failed: {res.stderr}")
        data = json.loads(res.stdout)
        self.assertEqual(data["source_sha"], self.source_sha)
        self.assertIn("artifact_sha256", data)
        self.assertTrue(out.exists())

        # Failure CLI call
        cmd_bad = list(cmd)
        cmd_bad[cmd_bad.index(self.source_sha)] = "invalid-sha"
        res_bad = subprocess.run(cmd_bad, capture_output=True, text=True)
        self.assertNotEqual(res_bad.returncode, 0)
        self.assertIn("Error:", res_bad.stderr)


if __name__ == "__main__":
    unittest.main()
