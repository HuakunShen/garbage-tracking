---
title: ~/.local tool pile
description: ~/.local totals 2.3 GB — cursor-agent keeps 3 versions each carrying ~110MB of node, agy has a duplicate binary, opencode.db grew 44MB in three days with no rotation; about 0.5 GB is safely recoverable
category: devtool
os: [macos]
last-verified: 2026-09-30
---

# ~/.local tool pile

`~/.local` is the XDG-style user-level install location (`bin`/`share`/`state`), shared on this machine by multiple CLI tools: cursor-agent, uv, opencode, agy (antigravity CLI), ai-lens, droid, xc, etc. `du -sh ~/.local` measures **2.3G** (2026-09-30); the research snapshot's figure is 2.23 GiB (bin 537M + share 1.6G + state 106M). The problem pattern is not a single big consumer but the stacking of "each tool keeps its own versions and upgrade backups; databases and logs have no retention policy"; on the memory side there are no records at all.

## Disk issues

### macOS

| Path | Type | Measured size | Delete-ability | Notes |
|------|------|----------|----------|------|
| ~/.local/share/cursor-agent/versions/ | Version accumulation | 417 MB | Safe (old versions) | 3 version directories each carry a full node binary (110,712,624 B ×2 + 116,870,064 B); both `~/.local/bin/agent` and `cursor-agent` symlinks point to 2026.01.23-916f423; the two 2025.09 old versions (132M + 131M = 263M) can be deleted |
| ~/.local/bin/agy.1789498877858012000.old | Old-version backup | 172 MB (180,089,984 B) | Safe | The old binary "renamed and kept" during upgrade; the filename timestamp decodes to 2026-09-16 03:01:17, generated 8 seconds apart from the active agy (181,740,432 B, mtime 03:01:25) |
| ~/.local/share/opencode/opencode.db | Unbounded-growth database | 160 MB (162,402,304 B) | Caution (deleting loses session history) | Measured 116,789,248 B on 9/27, up about 44 MB in 3 days; companion -wal 0 B and -shm 32K; no sign of archival/VACUUM |
| ~/.local/share/opencode/log/opencode.log | Log without rotation | 26 MB (27,074,843 B) | Safe (tool rebuilds it) | Single-file append; measured 46,934,762 B on 9/27, re-measured on 9/30 it had shrunk to 26 MB, apparently reset at startup (mechanism unverified) |
| ~/.local/share/uv/ | Toolchain/tool accumulation | 395 MB | Caution (re-downloadable) | python/ 249M (multiple CPython toolchains coexisting: 3.10/3.11/3.12/3.15) + tools/ 147M (standalone venvs installed by `uv tool`) |
| ~/.local/state/ai-lens/ | Cache accumulation | 104 MB | Safe (cache) | scan-cache/ 104M + pricing-cache.json 180K, all regenerable caches |

**Design issue**: four mechanisms stacked — (1) the cursor-agent installer puts each version wholesale into `versions/<date>-<hash>/`, bundling a complete Node runtime; upgrades only add and never remove, `bin` selects versions via symlinks, and there is no GC inside the directories (all three versions on this machine coexist at about 338 MB of pure node binaries); (2) agy's upgrade script uses a "rename old binary to `.old` and keep it" strategy and never reclaims, so each upgrade adds ~170 MB net (note: this `.old` on this machine is a product of the 2026-09-16 upgrade, about two weeks old, not an ancient leftover); (3) opencode writes sessions/messages into a monolithic SQLite and appends logs to a single file with no retention policy, so the db grows unboundedly; (4) uv downloads multiple Python toolchains on demand into `share/uv/python`; multi-version coexistence is by design, but left uncleaned by the user they persist forever. Whether upstream provides automatic cleanup options: cursor-agent and agy are unverified; uv officially provides `uv python uninstall` / `uv cache clean` and similar commands (this read-only audit executed none of them; only the directory structure was confirmed).

### Windows

To be filled in by community contributions (path conventions in apps/index.md)

### Linux

To be filled in by community contributions (path conventions in apps/index.md)

## Memory issues

| Process | Pattern | Notes |
|------|------|------|
| No known issues recorded | — | This machine's scan memoryNotes is empty; no resident/helper process problems observed |

## Cleanup recommendations

- **Safe** (no side effects from deletion; the software rebuilds it itself):
  - `~/.local/bin/agy.1789498877858012000.old` — the old binary kept as an upgrade backup, 172 MB; the active `agy` is intact
  - `~/.local/share/cursor-agent/versions/2025.09.12-4852336/`, `~/.local/share/cursor-agent/versions/2025.09.18-7ae6800/` — the symlinks point to the 2026.01.23 version; 263 MB combined; re-downloadable even if deleted by mistake
  - `~/.local/state/ai-lens/scan-cache/` — scan cache, 104 MB, regenerable
  - `~/.local/share/opencode/log/` (or truncate opencode.log) — logs, 26 MB
- **Caution** (caches or config are lost, rebuilding has a cost, needs user confirmation):
  - `~/.local/share/opencode/opencode.db` — deleting it loses all session history; if you only want to shrink it, back it up first and try VACUUM (effect unverified)
  - Toolchains under `~/.local/share/uv/python/` no longer in use (e.g. 3.10 / 3.15.0a8) — confirm what is in use with `uv python list` before uninstalling; re-downloading has a download cost; the `~/.local/bin/python3.11` symlink depends on the 3.11 toolchain, do not touch
  - `~/.local/share/uv/tools/` — tool venvs installed by `uv tool`, 147 MB; after deletion they must be reinstalled with `uv tool install`
- **Do not delete** (user data):
  - Self-installed binaries themselves such as `~/.local/bin/agy`, `uv`, `uvx`, `xc`, `droid`, `extism`
  - The `~/.local/bin/cursor-agent` and `agent` symlinks and `~/.local/share/cursor-agent/versions/2026.01.23-916f423/` (the version currently in use)
  - `~/.local/share/opencode/repos/` (40M), `snapshot/` (27M), `shell/` — project snapshots and shell history recorded by the tool

## Upstream status

- Official cleanup options: uv's official CLI provides Python toolchain and cache management (`uv python uninstall`, `uv cache clean`); whether cursor-agent, opencode, and agy have version cleanup/log rotation options: unverified (no upstream search performed this time)
- Related issues/PRs: no evidence yet, to be filled in (no upstream search performed; no links fabricated)
