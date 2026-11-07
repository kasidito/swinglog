# Source and local adaptation

- Source: https://github.com/anthropics/skills
- Revision: `2c5958ecac7cee2b583967a2c4981d0f4a75c579`
- Skill directory: `skills/webapp-testing`
- License: Apache-2.0; see `LICENSE.txt` and preserved upstream notices.
- Reviewed: 2026-11-07.
- Installation: manual vendoring, no upstream installer/plugin/hooks.

## Local changes

Added the repository integration paragraph and this attribution. Added/replaced `agents/openai.yaml` with explicit invocation only, no dependencies. Codex adaptation: inspect bundled scripts before executing them; the upstream black-box advice below does not bypass review. Paths in examples are relative to this skill directory, not the repository root. Use Python 3, an installed Playwright package and browser; do not automatically download dependencies. In this environment Chromium is /usr/bin/chromium. Use a concrete page-ready assertion when networkidle is unsuitable (e.g. streaming/long polling). Browser emulation does not prove physical iPhone behavior.


All other files in this skill bundle are retained from upstream, except generated caches and replaced agent metadata. Read upstream examples as examples, not authorization to run them.
