# Source and local adaptation

- Source: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- Revision: `b7d5353e0130feb8c5574ef1251f8a1db1873ccb`
- Skill directory: `.claude/skills/ui-ux-pro-max`
- License: MIT; see `LICENSE` and preserved upstream notices.
- Reviewed: 2026-11-07.
- Installation: manual vendoring, no upstream installer/plugin/hooks.

## Local changes

Added the repository integration paragraph and this attribution. Added/replaced `agents/openai.yaml` with explicit invocation only, no dependencies. Codex adaptation: the scripts are under this skill directory. Run from the repository root using python3 .agents/skills/ui-ux-pro-max/scripts/search.py. PRODUCT.md and DESIGN.md (and the user-selected Impeccable direction) take precedence over generated palettes, fonts or design-system suggestions. Do not create or overwrite a competing design-system/ master unless requested. Local read-only search needs Python 3 and no third-party Python packages. Treat generated GSAP/font/icon recommendations as optional; do not install packages, contact font CDNs, or enable hooks automatically.

Replaced Claude plugin-specific executable paths with repository-local Python 3 paths.

All other files in this skill bundle are retained from upstream, except generated caches and replaced agent metadata. Read upstream examples as examples, not authorization to run them.
