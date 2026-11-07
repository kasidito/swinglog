# Repository Agent Skills

Reviewed **2026-11-07**. Eight curated skills are vendored in `.agents/skills/<name>/`, pinned to the source revisions below. All ten requested sources were inspected; two are deliberately deferred. No upstream installer, lifecycle hook, plugin, MCP server, provider routing, or credentialed command was installed or enabled.

## Discovery and use

Start Codex in this repository or a subdirectory. Open `/skills` or type `$` and select a skill, for example:

```text
$systematic-debugging Investigate why reopening a session loses progress.
$domain-modeling Clarify the difference between a tray, a session and a shot.
$karpathy-guidelines Implement the agreed backup validation with a narrow diff.
$webapp-testing Verify the home-to-session flow at 390px.
$ponytail-review Review the current branch for defects and data-loss risks.
$ui-ux-pro-max Review touch targets using the current SwingLog design.
$verify-and-stop Verify this change against its acceptance criteria.
$performance-optimization Measure the slow history render before changing it.
```

All eight ship `agents/openai.yaml` with `policy.allow_implicit_invocation: false`: they are discoverable and explicitly invokable, but do not silently impose eight overlapping workflows. This is an invocation policy, not a disabled skill. No user/global Codex configuration is changed. If a skill is missing, restart Codex from the correct checkout; check for user/admin settings that disable it or another installation with the same name. Codex does not merge duplicate names. See [official discovery and invocation documentation](https://developers.openai.com/codex/skills/).

A Git worktree shares Git history but not uncommitted files: these skills are on `chore/reusable-agent-skills`. Switch to that branch (or merge the reviewed PR later) before expecting another checkout to discover them. No automatic merge is performed.

## Selected sources

The revision link opens the exact snapshot inspected, not a moving branch. Every installed skill has `SOURCE.md`, its license/declaration, and all assets/references required by its selected workflow. The full installation README and applicable license/NOTICE files are preserved under [docs/skills/upstream](docs/skills/upstream). The MIT declaration limitation for Karpathy is explicit below.

| Source at inspected revision | Installed skill | Why selected / compatibility | Dependencies and verification |
|---|---|---|---|
| [obra/superpowers · 22f0b463](https://github.com/obra/superpowers/tree/22f0b463e7a5e579904dd6211a520321035526f7) | `systematic-debugging` | Root-cause investigation for PWA, persistence and test failures. MIT. Supporting tracing/waiting/defense docs, TS example and diagnostic shell script retained. References to uninstalled sibling skills replaced with inline test-first guidance and `$verify-and-stop`. | Instructions load in Codex. Uses existing npm/Vitest tools; diagnostic script requires a POSIX shell and must be inspected before use. Script retained, not executed here. |
| [mattpocock/skills · 4ae2317d](https://github.com/mattpocock/skills/tree/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d) | `domain-modeling` | Distinguish shots, sessions, trays and recorded versus measured values. MIT. Glossary and ADR templates retained. No automatic glossary creation during unrelated tasks. | Instruction-only, no external service required. Codex loader verified. |
| [multica-ai/andrej-karpathy-skills · 2c606141](https://github.com/multica-ai/andrej-karpathy-skills/tree/2c606141936f1eeef17fa3043a72095b4765b9c2) | `karpathy-guidelines` | Focused changes, explicit assumptions and verifiable goals. Upstream SKILL frontmatter and README declare MIT; **no standalone license text or copyright notice is supplied at this revision**. Both declarations are retained; no author/copyright notice has been invented. | Instruction-only. README's installer points at `forrestchang/...`, not the requested fork; we manually vendor the requested `multica-ai` snapshot instead. Codex loader verified. |
| [anthropics/skills · 2c5958ec](https://github.com/anthropics/skills/tree/2c5958ecac7cee2b583967a2c4981d0f4a75c579) | `webapp-testing` | Relevant Python Playwright workflow. The selected skill's LICENSE.txt is Apache-2.0; root third-party notices retained. Claude product/plugin installation is not required for this plain skill. | Python 3 + Playwright + browser, plus app dependencies/server. All helper/examples retained; inspected and syntax-parsed, not executed. Codex loader verified. |
| [DietrichGebert/ponytail · 96608e07](https://github.com/DietrichGebert/ponytail/tree/96608e078b2d5ea607c5c3b8b5a54d1c1fba6846) | `ponytail-review` | One review workflow with concrete defect cases. MIT. Adaptation follows user's language and SwingLog's actual single-user load. | Instruction-only. Plugin defaults use Node lifecycle hooks; neither hooks nor global level-switching are installed. Codex loader verified. |
| [nextlevelbuilder/ui-ux-pro-max-skill · b7d5353e](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/tree/b7d5353e0130feb8c5574ef1251f8a1db1873ccb) | `ui-ux-pro-max` | Local searchable UX/a11y/React guidance. MIT. Entire selected directory retained, including data CSV/JSON, scripts and references. Claude plugin paths replaced with repository-local paths. | Python 3.10+ recommended for bundled syntax; standard library only for search. Static syntax/data presence and actual Codex load verified. No uipro CLI or npm installation. Read-only query smoke test documented below. |
| [safishamsi/graphify · 16218bfc](https://github.com/safishamsi/graphify/tree/16218bfc80d4ca2799734d045039f7ed1a5fa9fb) | **Deferred** | Apache-2.0 (root LICENSE, NOTICE and legacy LICENSE-MIT preserved). No literal SKILL.md exists in the current tree; `graphify/skill-codex.md` is a frontmatter-bearing Codex template with platform-specific references. It is adaptable, not intrinsically incompatible. | Full workflow auto-installs `graphifyy` and may select external model backends/credentials. Python ≥3.10 plus extraction dependencies and a graph are needed. No CLI, graph, graph-first AGENTS rules, hook, MCP server or model backend enabled. |
| [JuliusBrussee/caveman · c310c9d3](https://github.com/JuliusBrussee/caveman/tree/c310c9d300df13a1dd9f5c086120ffd857a164a1) | `verify-and-stop` | Narrow verification-only workflow, without telegraphic voice or provider routing. Current repository Apache-2.0; LICENSE, NOTICE, LICENSING.md and legacy LICENSE-MIT retained. | Instruction-only. Caveman CLI, telemetry, Auto/cloud routing, compression, memory rewriting, multi-agent modes and hooks are **not** included. Codex loader verified. |
| [addyosmani/agent-skills · 301b02b1](https://github.com/addyosmani/agent-skills/tree/301b02b12bff98e4688e6984af6556802322bbde) | `performance-optimization` | Measure-before-change workflow for history, media and bundle performance. MIT. Shared performance checklist copied into this skill and both relative pointers repaired. | Instructions load in Codex. Profiling uses existing tools; Lighthouse/bundlesize/field telemetry examples are optional dependencies, not installed or agreed budgets. No production analytics added. |
| [Leonxlnx/taste-skill · f6b76575](https://github.com/Leonxlnx/taste-skill/tree/f6b76575f949707b4e3c37cd86cb44b0b98643e8) | **Deferred** (`design-taste-frontend`) | MIT, with additional asset provenance to preserve if imported later. It targets company/marketing sites, mandates a competing visual system and motion, and contains a Stop command hook in SKILL frontmatter. Those defaults conflict with the current task-oriented PWA/Impeccable brief. | Node ≥22 + Chrome/Chromium, optional ffmpeg, bundled photos/layout assets and checking scripts. Not copied partially: retaining a SKILL.md without its substantial asset kit would misrepresent support. Hooks/gates/scripts were not run. |

## Duplicate and conflicting instructions

- **One workflow per role.** Superpowers, Matt Pocock, Caveman, Ponytail and Addy all offer planning/testing/review variants. Only the specialist above is installed for each job. Superpowers bootstrap, brainstorm, plan execution, TDD mandate, agent dispatch and branch-finishing skills are omitted; no automatic delegation, commit, merge, PR or browser companion.
- **General coding principles versus task scope.** Karpathy's caution and Superpowers' strict test-first language must not force permission loops or unrelated tests for trivial edits. Repository integration paragraphs preserve task authorization and risk-appropriate checks. No skill authorizes exposing credentials in debugging output.
- **Verification overlap.** Caveman's narrow `verify-and-stop` is the chosen verification skill; Superpowers verification and the other providers' duplicates are omitted. It does not prematurely end an implementation task. Current matching evidence may be reused; stale results cannot establish completion.
- **Review language and scale.** Ponytail's English example is not a language mandate here, and server scale suggestions apply only when the implementation actually has a server/multi-user workload.
- **Visual authority.** `PRODUCT.md`, `DESIGN.md`, Thai-first copy, offline behavior, local fonts, the no-emoji rule and an explicitly selected Impeccable direction outrank database suggestions. UI/UX Pro Max is a reference, not permission to generate a competing design master or install GSAP/icon/font dependencies. Taste is deferred; Anthropic frontend-design, canvas-design, theme-factory and other visual duplicates are omitted.
- **Provider-specific tooling.** Matt's setup/pre-commit/Claude guardrails, Anthropic Claude API/MCP-builder/document suites, Caveman installer/Auto, Ponytail level hooks, and Graphify provider/MCP integrations are not necessary for these workflows and not included.
- **Examples are not project changes.** Template links to sample domain folders, performance budgets, telemetry, package installation and diagnostic shell commands are explanatory examples. No upstream instructions expand the user's authorized scope. No upstream root AGENTS.md/CLAUDE.md or plugin manifest was copied into repository control locations.

[Machine-readable source audit](docs/skills/source-audit.json) indexes every discovered SKILL.md plus Graphify's alternate Codex template, with name, description, source content hash, risk signals and selected installation (or null). Duplicate `.openclaw`, plugin and CLI copies are indexed but not installed twice. This is a metadata/content scan plus targeted review of chosen workflows and installation/license docs, not a security audit of every command in all ten repositories.

## Verify and understand the limits

```bash
python3 scripts/verify-skills.py
python3 scripts/test-verify-skills.py
python3 scripts/verify-skills.py --codex
```

The offline check needs Python ≥3.10, uses only the standard library and **does not execute vendored code**. It checks file hashes, unique names matching directory names, frontmatter fields, explicit-only metadata, required local assets/references, attribution/license presence, upstream documentation hashes, Python syntax and CSV readability. It does not enforce dummy glossary links inside sample templates. Generated `__pycache__`/`.pyc` files are ignored. The complete file manifest catches dropped assets, including the UI data tables.

`--codex` additionally uses the installed local Codex CLI's `app-server` → `skills/list`, disables hooks/analytics/MCP configuration for that subprocess, and makes no model request. It requires Codex's normal writable runtime/cache location; a restricted sandbox may block it even when static checks pass. `--write-evidence` additionally records sanitized repository-only discovery. It does not change your global configuration.

**Observed:** Codex CLI `0.167.0-alpha.4` returned all **8 repository skills enabled, no loader errors**. See [discovery evidence](docs/skills/codex-discovery.json). This verifies parsing/discovery, not task-quality evaluation, implicit matching (disabled), automatic inclusion in every existing chat, or execution of external dependencies. Open a new Codex session from this checkout if needed. User/admin skill installations are outside this repository and were not altered.

Environment dependencies observed during setup: Python 3.12.14, Node 24.22.1, Chromium at `/usr/bin/chromium`, Python Playwright and Codex CLI available. Exact machine versions are in [verification evidence](docs/skills/verification.json); availability on another machine is not guaranteed. SwingLog retains its existing npm/Vite/Vitest setup. No runtime application code, package dependencies or deployment workflow changed.

## Updating or removing

1. Select a new upstream revision deliberately; read its install docs, license and selected skill diff again. Never track `main` through symlinks or auto-update scripts.
2. Preserve local integration notes, `agents/openai.yaml` policy, all required references/assets, source attribution and upstream license/NOTICE files. Do not copy installer/plugin/hooks configuration as an incidental update.
3. Update the corresponding source/metadata audit and `docs/skills/manifest.json` hashes after reviewing changes, not to silence an unexplained mismatch. Re-run static checks and actual Codex discovery.
4. To remove a skill, delete its folder and update this inventory, audit selection and manifest. Do not remove user/global skills or shared sources still used by another skill.
5. Reconsider Graphify only for a concrete architecture-query use case with an agreed CLI/dependency/backend plan; keep initial queries local, and request approval before any credentialed backend or hook/MCP setup. Reconsider Taste for an explicitly requested marketing surface after agreeing its visual system and whether to remove its hook.
