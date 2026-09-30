---
title: ChatGPT / Codex
description: The machine's number one garbage source — ~/.codex grew from 37.65 GiB to 156.7 GB in three days, with 106 GB reclaimable from cargo intermediate artifacts in agent worktrees alone; the desktop app's embedded Codex spawns MCP servers in full sets per session and never reclaims them (peak 137 processes / 3.69 GB).
category: ai-coding
os: [macos]
last-verified: 2026-09-30
---

# ChatGPT / Codex

OpenAI's ChatGPT desktop app (Electron shell) + Codex CLI (installed standalone at `~/.codex`, and also embedded in ChatGPT.app as codex-cli/cua_node). This is number one on both the disk and memory problem lists: on disk, `~/.codex` grew from 37.65 GiB to 156.7 GB in three days (`du -sk` measured 164,268,904 KiB, 2026-09-30); cargo/npm build artifacts in the agent's self-created worktrees total 100 GB+ and are never reclaimed, and session jsonl files, the log database, and old CLI versions all grow without end; in memory, the embedded Codex spawns a full set of stdio MCP servers every time a thread is opened and never reclaims them — per-process memory is stable while process count grows monotonically, and only restarting the app clears it. One-line conclusion: on the disk side about 113 GB is reclaimable (106 GB of that being regenerable cargo target); on the memory side it is a process-level leak, with a historically measured peak of 137 child processes / 3.69 GB RSS / all at 0% CPU.

## Disk issues

### macOS

| Path | Type | Measured size | Delete-ability | Notes |
|------|------|----------|----------|------|
| ~/.codex/worktrees/ | Build intermediate artifact buildup | 124 GB | Caution (target deletable, the repos themselves need verification) | The agent creates a git worktree per task and builds in place: two cargo `target/` directories at 57G + 49G = 106G, plus 8+ `node_modules` of 1.4–1.7G each; worktrees are created but never cleaned, 10+ of them dating back to 09-26 |
| ~/.codex/sessions/ | Unbounded session record accumulation | 19 GB | Caution (session history) | 5,264 rollout jsonl files with no retention policy; a single file, rollout-2026-09-17….jsonl, has reached 2,751,505,056 B (2.56 GiB) and was still being appended on the morning of 09-30 |
| ~/.codex/packages/standalone/releases/ | Version pileup | 4.1 GB | Safe (old versions; keep the latest 0.159.2) | 14 historical CLI versions (0.142.2→0.159.2), each a full copy of 242–314 MB; at the 09-27 audit there were 10 / 2.9G, with 4 more added in three days |
| ~/.codex/thread_history_1.sqlite | Unbounded database | 4.1 GB | Caution (thread history; can be shrunk with VACUUM) | Thread history database with no rotation and no cap; the WAL is permanently 5 MB |
| ~/.codex/logs_2.sqlite | Log database with no rotation | 2.6 GB | Safe (pure logs; delete after quitting the app) | Operational log database with no rotation and no retention window; this single database is larger than many apps' entire data |
| ~/.codex/archived_sessions/ | Archived session accumulation | 2.0 GB | Caution (user data) | The archiver moves items between sessions↔archived, yet the directory's total still grows net |
| ~/.codex/.tmp/ | Leftover temp files | 379 MB | Safe | 1,350 entries (git temp directories etc.), including failed leftovers `..codex-global-state.json.tmp-*` from July–August |
| ~/.codex/sqlite/ | Orphaned old database | 94 MB | Safe | Old logs_2.sqlite copies replaced on June 17; the main database moved up one level, and these leftovers have sat for 3+ months with no cleanup |
| ~/Library/Logs/com.openai.codex/ | Log pileup | 205 MB | Safe | 173 files, daily directories + 10 MB/file rolling; individual files are capped but there is no total cap, about 40–50 MB on active days |
| ~/Library/Application Support/Codex/ | Rebuildable cache | 446 MB | Safe (Partitions 175M + component_crx_cache 55M) | Chromium profile and component cache of the embedded browser codex-browser-app; rebuildable |
| /Applications/ChatGPT.app | Embedded dev toolchain inside the bundle | 1.49 GB (1,562,344 KiB) | No (app bundle; manual deletion breaks the signature) | Embedded codex-cli 314M + cua_node (a full Node runtime) 270M + tectonic (LaTeX engine) 52M = 636M unrelated to chat, 42% of the bundle |

(All sizes above measured on this machine with `du -sh` on 2026-09-30 unless noted; `~/.codex` total via `du -sk` = 164,268,904 KiB ≈ 156.66 GiB, versus the 09-27 audit value of 39,475,132 KiB = 37.65 GiB — a net gain of about 119 GB in three days.)

**Design issues**:

- **Local state comprehensively unbounded**: under ~/.codex, all four directory classes — sessions / worktrees / logs / releases — have no retention window, no total cap, and no automatic cleanup. Session jsonl files are append-written per rollout and never roll; worktrees are left behind in full after a task ends (including all build artifacts); on every self-update the CLI copies the new version wholesale into packages/standalone/releases and never deletes old ones (even adjacent patches 0.157.0/0.157.1 each keep a full 314 MB copy). Whether official retention-policy/cleanup configuration options exist: unverified (no effective cleanup action was observed on this machine).
- **SQLite with no maintenance policy**: logs_2.sqlite (2.6 GB) and thread_history_1.sqlite (4.1 GB) keep growing with no VACUUM/checkpoint; the orphaned old databases left behind after replacement (`~/.codex/sqlite/logs_2.sqlite`) have sat for 3+ months.
- **Desktop logs roll but never delete**: codex-desktop logs roll at 10 MB/file into daily directories, but segment files for historical dates never expire and there is no total cap.
- **A complete toolchain stuffed into the bundle**: ChatGPT.app statically ships the Codex CLI, a standalone Node runtime (cua_node, duplicating Electron's own Node), and the LaTeX engine tectonic in the installer rather than downloading on demand — 42% of the 1.49 GB chat app's size is unrelated to chat.
- Related issue links: unverified (this entry is based on local forensics; upstream repositories were not searched, and unverified issue numbers are not cited).

### Windows

To be filled in by community contributions (path conventions in apps/index.md)

### Linux

To be filled in by community contributions (path conventions in apps/index.md)

## Memory issues

| Process | Pattern | Notes |
|------|------|------|
| codex app-server (host of the Codex CLI built into ChatGPT) | Process leak (stdio MCP servers spawned per session, never reclaimed) | Every new thread launches a full new set of context7 / shadcn-studio (each npm exec+node), aws-mcp (uvx+python), cua_node (node+server.mjs), and node_repl, none reclaimed when the session ends. Measured 09-27: 137 child processes / 3.69 GB RSS / all 0% CPU / 20 complete duplicate sets, the oldest set alive 3h52m, plus a cross-day orphan context7-mcp alive 1 day 23 hours; 09-30 retest: 14 child processes / 0.76 GB within 90 seconds of app launch, and at the 32-minute mark the same day, 7 child processes / 0.36 GB — per-process memory stable, what grows is the process count; the pattern reproduced consistently within three days |
| Same as above, codex app-server | Resident single process with high memory | `-c features.code_mode_host=true app-server` single process RSS 1.26 GB (app running only 7 minutes; the 09-27 version in the same role ran 8 hours at 512 MB); 09-30 retest at the 32-minute mark: 1.11 GB (1,163,296 KiB, `ps -axo pid,ppid,rss`) |
| ChatGPT.app whole tree | Multi-process stacking | Whole tree 37–46 processes / 4.87–5.23 GB RSS; within 30 seconds 43→46 processes, +90 MB; 09-27 historical watermark: 142 processes / 13.86 GB footprint; the only wholesale reclaim point is quitting the app |

**Mechanism**: MCP's stdio transport delegates "connection lifetime = process lifetime" to the client, but the client implements only the spawn half — nothing is reclaimed when a session (thread) ends, no idle TTL, no supervisor reconciliation, no process budget, and app exit is the only reclaim point; the `npx -y` launch method doubles each server's process count. The leak is not in per-process memory but in process count growing monotonically with thread count. See the research document "In-depth analysis report on the Codex MCP process leak and memory exhaustion" (2026-09-27) for details.

## Cleanup recommendations

- **Safe** (no side effects, software rebuilds on its own):
  - `~/.codex/worktrees/*/**/target/` (cargo build artifacts, 106 GB, regenerable via `cargo build`; keep the worktree repos themselves)
  - All old versions in `~/.codex/packages/standalone/releases/` except the latest (currently 0.159.2) (≈3.8 GB)
  - `~/.codex/logs_2.sqlite` (delete after quitting ChatGPT/codex; or shrink with `sqlite3 … 'VACUUM;'`)
  - `~/.codex/sqlite/` (orphaned old log databases from three months ago)
  - `~/.codex/.tmp/` (leftover temp files)
  - `~/Library/Logs/com.openai.codex/` (pure logs)
  - `~/Library/Application Support/Codex/Partitions`, `~/Library/Application Support/Codex/component_crx_cache` (rebuildable browser caches)
- **Caution** (loses cache or configuration/history, rebuilding has a cost, user confirmation required):
  - `~/.codex/sessions/`, `~/.codex/archived_sessions/` (deletion loses session history)
  - `~/.codex/thread_history_1.sqlite` (thread history; back up first, and VACUUM can reclaim free space)
  - The repos themselves under `~/.codex/worktrees/` (may contain unmerged changes; check each with `git status` / `git log` before deleting)
- **Do not delete** (user data / credentials):
  - `~/.codex/auth.json`, `~/.codex/config.toml` (login credentials and all MCP/plugin configuration)
  - `~/.codex/memories*`, `~/.codex/dictation-history`, `~/.codex/attachments`, `~/.codex/generated_images` (user data)
  - Resources inside `/Applications/ChatGPT.app` (codex-cli/cua_node/tectonic are functional components; manual deletion breaks code signing — handle via official updates)

## Upstream status

- Official cleanup options: none found. No sign of any effective retention-policy configuration option for the data directories under ~/.codex; desktop logs only roll at 10 MB/file with no expiry cleanup; CLI self-updates do not clean old versions in packages/standalone/releases. Whether undisclosed configuration options exist: unverified.
- Related issues/PRs: unverified — this entry is based on local forensics and three research documents (In-depth analysis report on the Codex MCP process leak and memory exhaustion; ChatGPT ecosystem disk ledger: fair methodology and bundle necessity, part 06; part1-home-dotfiles); the openai/codex upstream repository was not searched, and unverified issue numbers are not cited.
