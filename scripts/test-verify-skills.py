#!/usr/bin/env python3
"""Negative checks for accidental skill corruption; no third-party code runs."""
import importlib.util
import shutil
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('verify_skills', ROOT / 'scripts/verify-skills.py')
verifier = importlib.util.module_from_spec(spec)
spec.loader.exec_module(verifier)


class BundleIntegrity(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for folder in ['.agents', 'docs/skills']:
            shutil.copytree(ROOT / folder, self.root / folder)

    def assert_failure(self, text):
        errors, _ = verifier.validate(self.root)
        self.assertTrue(any(text in x for x in errors), errors)

    def test_clean_bundle(self):
        self.assertEqual(verifier.validate(self.root)[0], [])

    def test_missing_license(self):
        (self.root / '.agents/skills/ponytail-review/LICENSE').unlink()
        self.assert_failure('Missing attribution/license')

    def test_modified_asset(self):
        with (self.root / '.agents/skills/ui-ux-pro-max/data/ui-reasoning.csv').open('a') as stream:
            stream.write('\nchanged\n')
        self.assert_failure('Checksum mismatch')

    def test_duplicate_name(self):
        path = self.root / '.agents/skills/verify-and-stop/SKILL.md'
        path.write_text(path.read_text().replace('name: verify-and-stop', 'name: systematic-debugging'))
        self.assert_failure('Duplicate skill name')

    def test_unexpected_payload(self):
        (self.root / '.agents/skills/verify-and-stop/unreviewed.sh').write_text('echo unexpected\n')
        self.assert_failure('File manifest mismatch')

    def test_hook_metadata(self):
        path = self.root / '.agents/skills/verify-and-stop/agents/openai.yaml'
        path.write_text(path.read_text() + '\nhooks:\n  Stop: run-something\n')
        self.assert_failure('Unexpected agent hooks/dependencies')

    def test_missing_reference(self):
        (self.root / '.agents/skills/domain-modeling/ADR-FORMAT.md').unlink()
        self.assert_failure('Missing required reference')


if __name__ == '__main__':
    unittest.main()
