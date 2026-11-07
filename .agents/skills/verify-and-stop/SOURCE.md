# Source and local adaptation

- Source: https://github.com/JuliusBrussee/caveman
- Revision: `c310c9d300df13a1dd9f5c086120ffd857a164a1`
- Skill directory: `skills/verify-and-stop`
- License: Apache-2.0; see `LICENSE` and preserved upstream notices.
- Reviewed: 2026-11-07.
- Installation: manual vendoring, no upstream installer/plugin/hooks.

## Local changes

Added the repository integration paragraph and this attribution. Added/replaced `agents/openai.yaml` with explicit invocation only, no dependencies. Codex adaptation: this is verification-only when explicitly invoked. It does not stop an implementation task before its authorized work is complete. Reuse evidence only when it matches the current files and conditions.


All other files in this skill bundle are retained from upstream, except generated caches and replaced agent metadata. Read upstream examples as examples, not authorization to run them.
