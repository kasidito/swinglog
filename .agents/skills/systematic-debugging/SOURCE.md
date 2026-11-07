# Source and local adaptation

- Source: https://github.com/obra/superpowers
- Revision: `22f0b463e7a5e579904dd6211a520321035526f7`
- Skill directory: `skills/systematic-debugging`
- License: MIT; see `LICENSE` and preserved upstream notices.
- Reviewed: 2026-11-07.
- Installation: manual vendoring, no upstream installer/plugin/hooks.

## Local changes

Added the repository integration paragraph and this attribution. Added/replaced `agents/openai.yaml` with explicit invocation only, no dependencies. Codex adaptation: use the repository test framework for the smallest meaningful regression test. The optional Superpowers TDD and verification skills are not installed: use the inline red/green workflow and $verify-and-stop instead. Do not run diagnostic scripts or print environment/credential values blindly; inspect them first. Match checks to task risk and existing authorization.

Replaced references to uninstalled Superpowers siblings with the existing framework and installed verify-and-stop skill.

All other files in this skill bundle are retained from upstream, except generated caches and replaced agent metadata. Read upstream examples as examples, not authorization to run them.
