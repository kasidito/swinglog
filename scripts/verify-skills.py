#!/usr/bin/env python3
"""Validate vendored skills offline; --codex also asks the local Codex loader.

Uses Python's standard library only. Never imports or executes vendored code,
installs dependencies, invokes a model, or enables hooks/MCP servers.
"""
import argparse
import ast
import csv
import hashlib
import json
import re
import selectors
import shutil
import subprocess
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def validate(root):
    manifest = json.loads((root / 'docs/skills/manifest.json').read_text())
    errors = []
    expected = {entry['name'] for entry in manifest['skills']}
    actual = {p.name for p in (root / '.agents/skills').iterdir() if p.is_dir()}
    if actual != expected:
        errors.append(f'Skill directory mismatch: expected {sorted(expected)}, found {sorted(actual)}')
    files = {str(p.relative_to(root)) for p in (root / '.agents/skills').rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix != '.pyc'}
    if files != set(manifest['files']):
        errors.append('File manifest mismatch (missing or unrecorded files)')
    names = set()
    for path in (root / '.agents/skills').rglob('*'):
        if path.is_symlink():
            errors.append(f'Symlinks are not portable in this bundle: {path.relative_to(root)}')
    for relative, digest in manifest['files'].items():
        path = root / relative
        if not path.is_file():
            errors.append(f'Missing: {relative}')
        elif hashlib.sha256(path.read_bytes()).hexdigest() != digest:
            errors.append(f'Checksum mismatch: {relative}')
    for entry in manifest['skills']:
        name = entry['name']
        folder = root / '.agents/skills' / name
        try:
            text = (folder / 'SKILL.md').read_text()
            if not text.startswith('---\n'):
                raise ValueError('missing YAML frontmatter')
            front = text.split('---', 2)[1]
            declared = re.search(r'^name: ([a-z0-9]+(?:-[a-z0-9]+)*)$', front, re.M)
            if not declared or declared[1] != name or len(name) > 64:
                errors.append(f'Invalid or mismatched name: {name}')
            if declared and declared[1] in names:
                errors.append(f'Duplicate skill name: {declared[1]}')
            if declared:
                names.add(declared[1])
            if not re.search(r'^description: .+', front, re.M):
                errors.append(f'Missing description: {name}')
            if re.search(r'^(hooks|allowed-tools|dependencies):', front, re.M):
                errors.append(f'Unexpected hooks/tools wiring: {name}')
            policy = (folder / 'agents/openai.yaml').read_text()
            if 'allow_implicit_invocation: false' not in policy:
                errors.append(f'Explicit-only invocation policy missing: {name}')
            if re.search(r'^(hooks|dependencies):', policy, re.M):
                errors.append(f'Unexpected agent hooks/dependencies: {name}')
            for required in ['SOURCE.md', entry['license_path']]:
                if not (folder / required).is_file():
                    errors.append(f'Missing attribution/license: {name}/{required}')
            for path in folder.rglob('*.py'):
                ast.parse(path.read_text(), filename=str(path))
            for path in folder.rglob('*.csv'):
                with path.open(newline='', encoding='utf-8-sig') as stream:
                    if not list(csv.reader(stream, strict=True)):
                        errors.append(f'Empty CSV: {path.relative_to(root)}')
        except (OSError, ValueError, IndexError, SyntaxError) as exc:
            errors.append(f'{name}: {exc}')
    # Actual references required by the chosen workflows, not dummy links in templates.
    required = {
        'systematic-debugging': ['root-cause-tracing.md', 'defense-in-depth.md', 'condition-based-waiting.md', 'find-polluter.sh', 'condition-based-waiting-example.ts'],
        'domain-modeling': ['GLOSSARY-FORMAT.md', 'ADR-FORMAT.md'],
        'webapp-testing': ['scripts/with_server.py', 'examples/console_logging.py', 'examples/element_discovery.py', 'examples/static_html_automation.py'],
        'ui-ux-pro-max': ['scripts/search.py', 'scripts/core.py', 'scripts/design_system.py', 'scripts/reasoning_contract.py', 'data/ui-reasoning.csv', 'references/pro-rules.md', 'references/quick-reference.md'],
        'performance-optimization': ['references/performance-checklist.md', 'references/optimization-patterns.md'],
    }
    for name, paths in required.items():
        for relative in paths:
            if not (root / '.agents/skills' / name / relative).is_file():
                errors.append(f'Missing required reference: {name}/{relative}')
    audit = json.loads((root / 'docs/skills/source-audit.json').read_text())
    if len(audit) != 10:
        errors.append('Expected ten inspected sources')
    for source in audit:
        folder = root / 'docs/skills/upstream' / source['repository'].replace('/', '--')
        for filename, digest in source['documentation_hashes'].items():
            # Non-English READMEs are indexed but not vendored; primary install/license docs are.
            if filename not in {'README.md', 'INSTALL.md', 'LICENSE', 'LICENSE-MIT', 'NOTICE', 'LICENSING.md', 'THIRD_PARTY_NOTICES.md'}:
                continue
            path = folder / filename
            if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != digest:
                errors.append(f'Upstream documentation changed/missing: {source["repository"]}/{filename}')
    return errors, manifest


def codex_list(root, expected):
    if not shutil.which('codex'):
        raise RuntimeError('Codex CLI is not on PATH; static validation still works without it')
    version = subprocess.check_output(['codex', '--version'], text=True, stderr=subprocess.DEVNULL).strip()
    with tempfile.TemporaryDirectory(prefix='swinglog-codex-state-') as state:
        command = ['codex', 'app-server', '--disable', 'hooks', '-c', 'analytics.enabled=false', '-c', 'mcp_servers={}', '-c', f'sqlite_home={json.dumps(state)}']
        process = subprocess.Popen(command, cwd=root, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, bufsize=1)
        response = None
        try:
            requests = [
                {'id': 1, 'method': 'initialize', 'params': {'clientInfo': {'name': 'swinglog-skill-check', 'version': '1.0'}}},
                {'method': 'initialized', 'params': {}},
                {'id': 2, 'method': 'skills/list', 'params': {'cwds': [str(root)], 'forceReload': True}},
            ]
            for request in requests:
                process.stdin.write(json.dumps(request) + '\n')
                process.stdin.flush()
            with selectors.DefaultSelector() as selector:
                selector.register(process.stdout, selectors.EVENT_READ)
                deadline = time.monotonic() + 25
                while time.monotonic() < deadline:
                    if not selector.select(timeout=1):
                        continue
                    line = process.stdout.readline()
                    if not line:
                        break
                    item = json.loads(line)
                    if item.get('id') == 2:
                        response = item
                        break
        finally:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
        if response is None:
            raise RuntimeError('No skills/list result; check CLI version and permission to write its normal runtime cache. No model request was made.')
        if 'error' in response:
            raise RuntimeError(f'Codex skills/list error: {response["error"]}')
        data = next(x for x in response['result']['data'] if x['cwd'] == str(root))
        found = [x for x in data['skills'] if x['scope'] == 'repo' and Path(x['path']).is_relative_to(root / '.agents/skills')]
        if {x['name'] for x in found} != expected or any(not x['enabled'] for x in found) or data['errors']:
            raise RuntimeError('Codex discovery failed: missing/disabled repository skills or loader errors')
        return {'codex_version': version, 'method': 'skills/list', 'model_request_made': False,
                'repository_skills': [{'name': x['name'], 'path': str(Path(x['path']).relative_to(root)), 'scope': x['scope'], 'enabled': x['enabled']} for x in found],
                'errors': data['errors'], 'limitations': 'Discovery and parsing only; no model-driven workflow or physical-device validation.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--codex', action='store_true', help='Also verify discovery with the installed Codex app-server')
    parser.add_argument('--write-evidence', action='store_true', help='Write sanitized discovery to docs/skills/codex-discovery.json (requires --codex)')
    args = parser.parse_args()
    if args.write_evidence and not args.codex:
        parser.error('--write-evidence requires --codex')
    errors, manifest = validate(ROOT)
    if errors:
        for error in errors:
            print(f'FAIL: {error}')
        raise SystemExit(1)
    print(f'PASS: {len(manifest["skills"])} skills; {len(manifest["files"])} file hashes; references, attribution, policies and Python syntax')
    if args.codex:
        try:
            evidence = codex_list(ROOT, {x['name'] for x in manifest['skills']})
        except (RuntimeError, OSError, ValueError) as exc:
            print(f'UNVERIFIED: {exc}')
            raise SystemExit(1)
        if args.write_evidence:
            (ROOT / 'docs/skills/codex-discovery.json').write_text(json.dumps(evidence, indent=2) + '\n')
        print(f'PASS: {evidence["codex_version"]} loaded all {len(evidence["repository_skills"])} repository skills with no errors')


if __name__ == '__main__':
    main()
