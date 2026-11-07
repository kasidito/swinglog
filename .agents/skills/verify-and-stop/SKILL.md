---
name: verify-and-stop
description: Prove existing work meets acceptance conditions without expanding scope. Use for validation-only tasks, completion checks, focused gate runs, and last-mile proof.
---

## Repository integration

Codex adaptation: this is verification-only when explicitly invoked. It does not stop an implementation task before its authorized work is complete. Reuse evidence only when it matches the current files and conditions.

See `SOURCE.md` for pinned upstream attribution, local changes, and license location.


# Verify and stop

Translate acceptance conditions into smallest sufficient proof set.

- Reuse still-current results with matching repository state.
- Run focused checks before wider gates.
- Distinguish pass, fail, unavailable, and blocked exactly.
- Do not edit product code unless verification request includes fixes.
- Do not add polish, cleanup, or unrelated tests after criteria pass.

Stop immediately when acceptance proof is complete. Report commands, results, and unresolved risk only.
