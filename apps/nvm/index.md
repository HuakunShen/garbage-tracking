---
title: nvm
description: 7 Node versions retained in full totaling about 3.0 GB; about 1.5 GB confirmed recoverable
category: devtool
os: [macos]
last-verified: 2026-09-30
---

# nvm

nvm (Node Version Manager) is a Node.js multi-version manager implemented as a shell function; each version is installed as a complete self-contained directory under `~/.nvm/versions/node/vX.Y.Z/` (bundling node, npm, corepack, and headers). All 7 versions on this machine are retained in full, totaling about 3.0 GB (re-checked 2026-09-30 with `du -sh ~/.nvm/versions/node` at 2.8 GiB — the same magnitude expressed as a decimal/binary conversion difference), of which v25.2.1 (1.1G) and v24.10.0 (790M) each drag along several hundred MB of global AI CLIs. Conclusion: about 1.5 GB is confirmed recoverable (v25.2.1 + the superseded-in-line v26.5.0 and v22.11.0); nvm itself has no resident process and no memory issues. Textbook version accumulation, severity: medium.

## Disk issues

### macOS

| Path | Type | Measured size | Delete-ability | Notes |
|------|------|----------|----------|------|
| ~/.nvm/versions/node/v25.2.1/ | Version accumulation + global package duplication | 1.1G | Caution (old global packages) | Non-LTS odd line, superseded by v26; of lib 919M, about 900M is global AI CLIs (@openai 309M, @github 259M, @google 172M, @deveco 143M); before deleting, confirm these CLIs have been reinstalled under another version |
| ~/.nvm/versions/node/v24.10.0/ | Version accumulation + global package duplication | 790M | Caution (independent major-version line) | The retained version of the 24 line; depends on old projects; lib 613M, with @google alone at 487M, plus @openai 60M, @qwen-code 42M, and yarn |
| ~/.nvm/versions/node/v26.5.0/ | Version accumulation | 218M | Safe (superseded in line) | Superseded by v26.8.2; a bare install containing only npm, no custom global packages |
| ~/.nvm/versions/node/v26.8.2/ | — | 222M | Do not delete | The current default line: `~/.nvm/alias/default` contains `26` (verified with cat) and resolves to this version |
| ~/.nvm/versions/node/v22.23.2/ | Version accumulation | 187M | Caution (active 22 line) | The newest retained version of the 22 line; deletable if you have no projects on the 22 line |
| ~/.nvm/versions/node/v22.11.0/ | Version accumulation | 188M | Safe (superseded in line) | Superseded by v22.23.2; a bare install containing only npm |
| ~/.nvm/versions/node/v20.19.0/ | Version accumulation | 154M | Caution (old LTS line) | The only retained version of the 20 line; depends on whether old projects still need to run on it |

The per-version sizes above were measured with `du -sh ~/.nvm/versions/node/*` (2026-09-30) and match the scan evidence item by item; total about 2.8 GiB ≈ 3.0 GB (scan value); `~/.nvm` as a whole is 3.0G.

**Design issue**: the accumulation is three overlapping mechanisms — (1) **add-only, never remove**: every `nvm install` writes the entire version tree (bin+lib+include+share, a base footprint of about 150–220M) fully to disk; a full-text grep of this machine's nvm.sh v0.40.0 finds only `nvm uninstall <version>` (help text at nvm.sh:3037), with no automatic cleanup/prune subcommand of any kind — after upgrading, old versions lie in place forever, and cleanup depends entirely on the user manually uninstalling them one by one. (2) **Node officially ships a major version every six months** (even lines are LTS, odd lines are short-lived), and the default alias only records the major version number (`26` on this machine), which guarantees resolution to the newest 26.x but never touches the superseded-in-line v26.5.0, let alone older major versions. (3) **Global packages are isolated per version**: each version has its own `lib/node_modules`, so switching Node versions means reinstalling every global CLI — previously installed old versions therefore get "frozen" at a few hundred MB up to 1GB (of v25.2.1's 919M lib, about 900M is AI CLIs; v24.10.0's @google alone is 487M; @openai and @google each keep a copy on both the v24 and v25 lines). This is the fundamental difference between nvm and tools like mise/volta that share global installs. Whether an upstream issue/PR exists for batch cleanup: unverified (the search service was rate-limited this time; no citable link obtained).

### Windows

To be filled in by community contributions (path conventions in apps/index.md)

### Linux

To be filled in by community contributions (path conventions in apps/index.md). Note: nvm's official script is a POSIX shell implementation; on Linux it likewise installs into `~/.nvm/versions/node/`, and the accumulation mechanism is expected to be the same as macOS; size data unverified.

## Memory issues

| Process | Pattern | Notes |
|------|------|------|
| — | No known issues recorded | nvm is a function sourced into the shell (~/.nvm/nvm.sh), with no resident process and no helper; both scans' memoryNotes were empty |

## Cleanup recommendations

- **Safe** (no side effects from deletion; the software rebuilds it itself):
  - `nvm uninstall v26.5.0` — deletes `~/.nvm/versions/node/v26.5.0/` (218M), superseded in line by v26.8.2 and a bare install; `alias/default=26` still resolves to v26.8.2;
  - `nvm uninstall v22.11.0` — deletes `~/.nvm/versions/node/v22.11.0/` (188M), superseded in line by v22.23.2, bare install.
- **Caution** (caches or config are lost, rebuilding has a cost, needs user confirmation):
  - `nvm uninstall v25.2.1` — reclaims 1.1G, but about 900M of it is global AI CLIs; before deleting, confirm these tools are already installed under v26 (or reinstall after deleting);
  - `~/.nvm/versions/node/v24.10.0/` (790M), `v20.19.0/` (154M), `v22.23.2/` (187M) — these belong to different major-version lines; before deleting, confirm no old projects rely on them via `.nvmrc` or a manual `nvm use`.
- **Do not delete** (user data):
  - `~/.nvm/versions/node/v26.8.2/` (222M) — the version currently used by the default alias;
  - `~/.nvm/alias/` (including `default=26` and the lts subdirectory) — delete the default alias and new shells will have no default Node;
  - `~/.nvm/nvm.sh`, `~/.nvm/bash_completion`, etc. — nvm itself; deleting them disables the whole tool.

## Upstream status

- Official cleanup options: `nvm uninstall <version>` uninstalls one at a time (verified against this machine's nvm.sh:3037 help text); this machine's nvm v0.40.0 has no `nvm prune` and no automatic cleanup subcommand of any kind (a full-text grep for "prune" only hits the `find -prune` argument), i.e. upgrading or switching versions never triggers any reclamation.
- Related issues/PRs: unverified (the search service was rate-limited; unable to verify issues in the upstream repo about batch-cleaning old versions; no links fabricated).
