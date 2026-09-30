---
title: Claude Code
description: ~/.claude grows unbounded to 6.7 GB — 1,846 session jsonl files totaling 5.1 GB that only accumulate, and a 1.5 GB complete backup of itself sitting inside the directory
category: ai-coding
os: [macos]
last-verified: 2026-09-30
---

# Claude Code

Anthropic's terminal AI coding agent (CLI). Every session appends the full conversation line by line to `~/.claude/projects/<project path slug>/<session uuid>.jsonl` with no total cap; on this machine it has piled up to 1,846 files / 5.1 GB (longest single session 254 MB), with `~/.claude` totaling 6.7 GB. About 1.5 GB of that is `.claude.bk`, a complete backup of itself embedded inside the tool's directory, sitting on disk alongside the original — the whole thing can be deleted with zero loss. Conclusion: about 1.6 GB reclaimable with zero loss (redundant backup + duplicate config backups); up to about 6.6 GB reclaimable if accepting the loss of old session history; no memory issues on record (CLI launches on demand, spot checks found no resident process).

## Disk issues

### macOS

| Path | Type | Measured size | Delete-ability | Notes |
|------|------|----------|----------|------|
| ~/.claude/projects/ | Session accumulation | 5.1 GB | Caution (loses session history) | 1,846 .jsonl files (measured with `du -ck` at 5,197,104 KiB); largest single file 266,269,685 B; organized in directories per project path, one file per session, append-only with no slimming |
| ~/.claude/.claude.bk/ | Redundant self-backup | 1.5 GB | Safe (deletable wholesale) | A complete copy of `~/.claude` nested inside `~/.claude` itself (projects 653M + transcripts 424M + debug 331M + shell-snapshots 56M + file-history 51M; measured with `du -ck` at 1,570,088 KiB); directory timestamp 2026-02-28, not a product of any official mechanism (origin unverified); backup and original on disk simultaneously |
| ~/.claude/transcripts/ | Session transcripts | 41 MB | Caution | Session transcript text; deletion loses the transcripts |
| ~/.claude/backups/ + ~/.claude.json.backup* | Redundant config backups | ~2 MB | Safe | 5 byte-identical (162,642 B) .claude.json backups in `~/.claude/backups/`; another 5 backups under `$HOME`, all generated within the same second at 2026-08-05 09:01; the original `~/.claude.json` is intact in both cases |

**Design issue**: session records are append-only JSONL — every message and tool output is appended verbatim to a single file, and long sessions (lots of file reads / build logs) can push a single file to hundreds of MB, with no total cap or size-based rotation. An official retention mechanism actually exists: `cleanupPeriodDays` (settings.json; docs default 30 days; cleans up transcripts by last-activity time at startup), and this machine does have a `.last-cleanup` marker (most recent 2026-09-25), yet `projects/` still contains files with mtime 2026-07-07 — so how the cleanup's actual coverage/trigger conditions map to the 30-day default is unverified; the net effect is 5.1 GB accumulating without limit. Self-backups like `.claude.bk` are not a known Claude Code mechanism; more likely a one-off manual migration/machine move copied the entire directory into its own body (origin unverified). Upstream already has attention on this: #24207 notes that ~/.claude has no monitoring, no cleanup command, and that writing a corrupt `.claude.json` at 0 bytes free triggers cascade failure (closed as not planned); #62476 notes that transcripts are silently deleted after 30 days by default and the setting is not exposed in `/config` (confirmed).

### Windows

To be filled in by community contributions (path conventions in apps/index.md)

### Linux

To be filled in by community contributions (path conventions in apps/index.md)

## Memory issues

No known issues recorded. (The scan did not collect memory data; `ps aux | grep claude` sampling during this audit (2026-09-30) found no resident claude CLI processes — the CLI launches on demand, which is not evidence of a leak pattern.)

## Cleanup recommendations

- **Safe** (no side effects, software rebuilds on its own):
  - `~/.claude/.claude.bk/` in its entirety (1.5 GB) — redundant self-backup; deleting it affects nothing;
  - `~/.claude/backups/` and `~/.claude.json.backup*` (~2 MB) — duplicate config backups; the original `~/.claude.json` remains.
- **Caution** (loses cache or configuration, rebuilding has a cost, user confirmation required):
  - Old session .jsonl files in `~/.claude/projects/` beyond the retention period — each deletion loses a resumable/replayable stretch of session history; the retention period can be raised via `cleanupPeriodDays` in settings.json, and setting 0 stops even writing transcripts to disk (see upstream #23710);
  - `~/.claude/transcripts/` (41 MB, loses transcripts);
  - `~/.claude/debug/`, `~/.claude/tmp/`, `~/.claude/paste-cache/` — diagnostics/temp data (debug measured 0 B on this machine; tmp/paste-cache not measured separately, negligible in scale).
- **Do not delete** (user data):
  - `~/.claude/settings.json`, `~/.claude.json` — main configuration, including login/account state; if corrupted when the disk is full, it gets reset by the default configuration (see upstream #24207);
  - `~/.claude/skills/`, `~/.claude/rules/`, `~/.claude/CLAUDE.md`, `~/.claude/RTK.md` — user-written instructions, rules, and skills;
  - `~/.claude/plugins/` (31 MB, installed plugins);
  - Recent sessions in `~/.claude/projects/` that you may still want to resume.

## Upstream status

- Official cleanup options: `cleanupPeriodDays` in settings.json (default 30 days; cleans session transcripts by last-activity time at startup; on this machine the `~/.claude/.last-cleanup` marker shows the most recent run on 2026-09-25; setting it to 0 stops writing transcripts, see #23710). There is no total cap and no manual cleanup command such as `claude clean` (proposed in #24207, not adopted).
- Related issues/PRs:
  - [anthropics/claude-code#24207](https://github.com/anthropics/claude-code/issues/24207) — "[BUG] No disk space management: ~/.claude grows unbounded, cascade failure destroys settings and auth at 0 bytes free" (2026-02-08, closed as not planned)
  - [anthropics/claude-code#62476](https://github.com/anthropics/claude-code/issues/62476) — "[BUG] Claude Code silently deletes conversation transcripts after 30 days by default" (2026-05-26, labeled confirmed/reproduced)
