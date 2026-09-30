---
title: ZCode
description: Resident 4.5–5 GB RSS (a full set of processes per session, no shared reuse) + ~5 GB of unbounded disk accumulation, with ≈4.8 GB recoverable
category: ai-coding
os: [macos]
last-verified: 2026-09-30
---

# ZCode

ZCode is Z.ai's AI coding workbench ("Agentic Development Environment"), consisting of a desktop Electron app (Electron 41.0.3) plus the `zcode` CLI, with the repo at [github.com/zai-org/ZCode](https://github.com/zai-org/ZCode) (Apache-2.0, forced open-source on 2026-09-21 due to a .git upload privacy incident). Resource profile: on the disk side, `~/.zcode` accumulates without bound to 3.6 GB (a monolithic sqlite of 1.1 GB + checkpoints of 928 MB + two sets of daily logs); the desktop app additionally has ≈1.4 GB of embedded-browser rebuildable caches and duplicate update packages. On the memory side, each session carries its own set of MCP servers and dedicated Electron helpers with no shared reuse; multiple sessions stack up to a resident 4.5–5 GB RSS. One-line conclusion: ≈4.8 GB reclaimable from disk (≈2.2 GB in the safe tier); memory is a "full process set per session" pattern rather than a single-point leak; also note that the menu-bar monitor's responsibility-attribution accounting charges things launched from ZCode sessions — like an Android emulator (8.76 GB) — to ZCode's name, displaying 12.95–15.23 GB while the app itself is actually about 4 GB (the 2026-09-28 research fully broke this down).

## Disk issues

### macOS

| Path | Type | Measured size | Delete-ability | Notes |
|------|------|----------|----------|------|
| ~/.zcode/cli/db/ | Monolithic sqlite, unbounded growth | 1.1 GB | Caution (loses session history) | The single `db.sqlite` file is 1.1 GB (plus a 5.3 MB WAL); all CLI session history/state is written to this one file, grows-only |
| ~/.zcode/v2/checkpoints/ | Session checkpoint accumulation | 928 MB | Caution (no rollback after deletion) | 6 hash-named checkpoint directories, no automatic expiry |
| ~/Library/Application Support/ZCode/session/Partitions/zcode-embedded-browser/ | Chromium rebuildable cache | 1.2 GB | Safe | The embedded browser partition's Cache 819 MB + Code Cache 343 MB = 1.16 GB of pure cache, automatically rebuilt after deletion |
| ~/.zcode/cli/artifacts/ | Session artifact accumulation | 595 MB | Caution (delete by old session) | One `sess_*` directory per session, never reclaimed after the session ends |
| ~/Library/Caches/@zcodedesktop-updater/ | Update packages stored twice | 466 MB | Safe | The same installer `ZCode-3.14.4-mac-arm64.zip` and `update.zip` have byte-identical sizes (243,937,593 B = 233 MB each); not cleaned after the update completes |
| ~/.zcode/v2/logs/ and ~/.zcode/cli/log/ | Daily logs never deleted | 455 MB (303 + 152) | Safe (old logs) | Two sets of daily-rotating logs: `v2/logs` with 14 daily .log files (largest single day 59 MB; scan recorded a single-day max of 72,858,811 B) + `cli/log` daily .jsonl (largest single day 36 MB), rotated but never cleaned |
| ~/.zcode/computer-use/ | Same .app stored twice | 249 MB | Safe (dev copy) | The release `ZCode Computer Use.app` at 125 MB coexists with a same-named .app of 124 MB under `dev/` — the dev/ one is a development-build leftover |

**Design issue**:

- **Monolithic sqlite** (`~/.zcode/cli/db/db.sqlite`): the CLI writes all session records into a single-file SQLite with no official rotation/VACUUM path whatsoever — the only disk entry in the official FAQ covers `~/.zcode/cli/exec` (measured 82 MB on this machine) and says nothing about the db. Whether a built-in cleanup command exists: unverified.
- **Checkpoints / artifacts never reclaimed**: both `v2/checkpoints` and `cli/artifacts/sess_*` append per session with no expiry policy (whether a hidden retention setting exists: unverified).
- **Update packages stored twice**: the updater keeps the downloaded installer in both `pending/` and `update.zip` (the two files are bit-identical), and both copies remain after installation completes.
- **Unbounded embedded-browser cache**: an Electron custom partition (`zcode-embedded-browser`) uses the Chromium HTTP cache, accumulating to 1.16 GB with long-term use; Electron's official docs never publish per-process overhead or cache-cap mechanisms (electronjs.org/docs/latest/tutorial/process-model).
- **Computer-use helper stored twice**: under `~/.zcode/computer-use/` a dev build coexists with the release build, managed by `.zcode-cua-helper-meta.json` but dev/ is never cleaned.

### Windows

To be filled in by community contributions (see apps/index.md for path conventions)

### Linux

To be filled in by community contributions (see apps/index.md for path conventions)

## Memory issues

| Process | Pattern | Notes |
|------|------|------|
| zcode-cli (session layer) | Multiple sessions stacking | Under the host `zcode-host-local-1` hang 6 concurrent top-level zcode-cli processes (measured 2026-09-30: 6766/6769/6772/6807 launched together with the app, 123–183 MB RSS each; 35981 at 346 MB / 93308 at 492 MB), plus per-session child-agent zcode-cli processes; the session layer totaled 2.6–2.9 GB at scan time. This measurement: 27 processes in the whole tree ≈4.3 GiB RSS (28 processes / 4.47 GB at scan time) |
| zcode-node-repl-mcp + session-dedicated helpers | Resident / helper abuse | Each session carries its own set: 3 `zcode-node-repl-mcp` MCP servers (92–212 MB RSS, footprint ~72 MB each) + session-dedicated Electron helpers (pids 50146/67804, `--max-old-space-size=256`, 54–69 MB). No cross-session shared reuse; each set stays resident until its session closes |
| ZCode Helper (Renderer) / (GPU) | Electron itself + nominal/actual mismatch | Renderer RSS steady at ~871 MB (measured 09-30 footprint 857 MB; 09-28 recorded 1.32–1.54 GB before being compressed back by the system) + GPU 133 MB + main process 290 MB; the 09-28 research recorded the GPU process at a 1.10 GB footprint while RSS was only 89 MB — nominal usage far exceeds actual, with the compressor paying the interest on its behalf |

**Monitoring accounting warning**: menu-bar monitors (such as Vorssaint) sum by macOS "responsibility attribution groups", charging **everything launched from a ZCode session** (the Android emulator qemu-system-aarch64 at 8.76 GB, xcodebuild, render subtrees, etc.) to ZCode's row, displaying 12.95–15.23 GB; while ZCode's own processes add up to about 4.1 GB individually (the 2026-09-28 research fully reproduced its algorithm and broke down the accounting, see §10). Quoting "ZCode uses 15 GB" is wrong.

## Cleanup recommendations

- **Safe** (no side effects if deleted; the software rebuilds on its own):
  - `~/Library/Application Support/ZCode/session/Partitions/zcode-embedded-browser/Cache` and `.../Code Cache` (delete after quitting ZCode, ≈1.16 GB, rebuilt automatically on restart)
  - `~/Library/Caches/@zcodedesktop-updater/` (466 MB, the same installer stored twice — useless once the update is installed, re-downloaded if ever needed)
  - Old-dated files in `~/.zcode/v2/logs/` and `~/.zcode/cli/log/` (455 MB)
  - `~/.zcode/computer-use/dev/` (124 MB development-build leftover; keep the release `ZCode Computer Use.app`)
- **Caution** (loses cache or config; rebuilding has a cost; needs user confirmation):
  - `~/.zcode/v2/checkpoints/` (928 MB; after deletion there is no rolling back to old checkpoints; old sessions you confirm need no rollback can be deleted)
  - `sess_*` directories of completed old sessions in `~/.zcode/cli/artifacts/` (595 MB)
  - `~/.zcode/cli/db/db.sqlite` (the 1.1 GB monolithic sqlite = all session history; deleting loses history and there is no official export/cleanup path — back up on your own before deleting)
- **Do not delete** (user data):
  - `~/.zcode/workspace/`, `~/.zcode/AGENTS.md`, `~/.zcode/agents/` (user workspace and agent config)
  - Session state inside `~/Library/Application Support/ZCode/session/` other than the caches above (`Session Storage`, `WebStorage`, etc.)

## Upstream status

- Official cleanup options: only one — the official FAQ mentions "`~/.zcode/cli/exec` is taking up a lot of space — can I delete it?" ([zcode.z.ai/en/docs/qa](https://zcode.z.ai/en/docs/qa)); there are no cleanup entries for db / checkpoints / logs / artifacts / the duplicate update packages, and the installation docs publish no minimum memory requirement ([zcode.z.ai/en/docs/install](https://zcode.z.ai/en/docs/install)).
- Related issues/PRs: **no linkable issue exists** — the repo's issue area is empty and marked "Issue creation is restricted in this repository", and the GitHub API search for `repo:zai-org/ZCode memory` returns `total_count: 0` ([github.com/zai-org/ZCode/issues](https://github.com/zai-org/ZCode/issues)). No public channel contains any first-hand ZCode memory measurement or resource problem report; this repo's cited 2026-09-28 process-tree accounting (3 sessions / 44 processes / 6.22 GB footprint, including the 15.23 GB monitor reading breakdown) is the first public measurement.

Evidence files: local scan and recheck records, and research document sources, are in [evidence-macos-2026-09-30.txt](evidence-macos-2026-09-30.txt).
