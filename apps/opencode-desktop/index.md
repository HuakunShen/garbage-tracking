---
title: OpenCode Desktop
description: The cli/ directory keeps 9 versions from 2.0.6→2.0.18 (8 old versions ≈1.33G of pure accumulation), and the updater stores the same 215M installer twice; ≈1.55 GB can be safely recovered in total
category: ai-coding
os: [macos]
last-verified: 2026-09-30
---

# OpenCode Desktop

The desktop client of OpenCode (sst/opencode) (an Electron app whose data directory bundle id on this machine is `ai.opencode.desktop`), which bundles its own version-managed opencode CLI. The resource problem is concentrated on disk: the `cli/` directory keeps 9 versions from 2.0.6→2.0.18 (1.5 GB in total), only the newest one is in use, and the 8 old versions ≈1.33 GB are pure version accumulation; the updater also stores the same 225,573,422-byte installer twice, once each in `update.zip` and `pending/` (215M×2). ≈1.55 GB can be safely recovered in total; no memory issues recorded (the scan did not collect memory data).

## Disk issues

### macOS

| Path | Type | Measured size | Delete-ability | Notes |
|------|------|----------|----------|------|
| ~/Library/Application Support/ai.opencode.desktop/cli/ | Version accumulation | 1.5 GB | Safe (old versions) | 9 version directories from 2.0.6→2.0.18, each version one 166–180M `opencode-cli` binary (measured one by one with `find -size +100M`); only the newest (2.0.18) is in use and the 8 old versions ≈1.33 GB are pure accumulation, with mtimes continuously added from 9/19 to 9/26 and the app never cleaning them |
| ~/Library/Caches/@opencodedesktop-updater/ | Duplicate storage of update packages | 431 MB | Safe (cache) | The top-level `update.zip` and `pending/opencode-desktop-mac-arm64.zip` are the same 225,573,422 B installer (SHA-256 measured identical: `caafaf8e…4913`); storing two copies = 215M of pure redundancy; `current.blockmap` also exists once each at the top level and in `pending/` (237,460 B×2) |

**Design issue**: the desktop app treats the CLI as a "runtime downloaded per version" — when it detects a new version it drops a complete binary into `cli/<version>/` instead of replacing in place. Measured: 8 versions were added within a week (9/19→9/26) and all 9 directories are still alive; no cleanup or retention-limit mechanism of any kind is in effect in the directory, and the 8 old versions ≈1.33 GB are the direct consequence of this add-only-never-remove model. The update pipeline's overall lack of a retention policy also has upstream evidence: issue #45087 reports a user whose auto-update loop "reinstalled every 10 minutes" consumed 266 GB. The updater cache's dual storage is the second mechanism: `pending/` keeps one complete installer, and there is also a byte-identical `update.zip` at the top level; which code path writes each copy and when (or whether) each is cleaned up is unverified. No official cleanup option was observed on this machine (`opencode.settings` is only 161 B with no retention-related fields; whether a hidden setting exists is unverified).

### Windows

To be filled in by community contributions (path conventions in apps/index.md)

### Linux

To be filled in by community contributions (path conventions in apps/index.md)

## Memory issues

No known issues recorded. (The scan did not collect memory data; a 2026-09-30 `ps aux | grep opencode` sample saw no opencode processes of any kind — the app was not running during the audit, which is neither evidence of a leak or resident process, nor evidence to the contrary.)

## Cleanup recommendations

- **Safe** (no side effects from deletion; the software rebuilds it itself):
  - All version directories under `~/Library/Application Support/ai.opencode.desktop/cli/` except the newest (on this machine that is 2.0.6 / 2.0.9 / 2.0.10 / 2.0.11 / 2.0.14 / 2.0.15 / 2.0.16 / 2.0.17, ≈1.33 GB) — obsolete old CLIs, re-downloaded when needed;
  - `~/Library/Caches/@opencodedesktop-updater/update.zip` (215M) — the redundant copy whose SHA-256 is completely identical to the one in `pending/`;
  - Or the entire `~/Library/Caches/@opencodedesktop-updater/` (431M) — updater cache; even if an update happens to be in progress, the cost of deleting it is only one re-download of the installer.
- **Caution** (caches or config are lost, rebuilding has a cost, needs user confirmation):
  - Electron caches under `~/Library/Application Support/ai.opencode.desktop/`: `Cache/` (41M), `Code Cache/` (8.9M), `GPUCache/`, etc. — rebuildable, but together under 60M with limited benefit;
  - `~/Library/Caches/ai.opencode.desktop/` (80K) — same as above, negligible in scale.
- **Do not delete** (user data):
  - `cli/2.0.18/` — the CLI binary currently in use (171M);
  - `drafts.sqlite` (6.1M) — session draft data;
  - `opencode.settings`, `.window-state.json`, `opencode.workspace.*`, `opencode.updater`, `.updaterId` — configuration and state files;
  - `logs/` (1.1M) — diagnostic logs, useful for troubleshooting.

## Upstream status

- Official cleanup options: none observed on this machine — no retention limit on version directories, no sign of automatic cleanup, and no related fields in `opencode.settings`; whether an official cleanup entry point exists is unverified.
- Related issues/PRs:
  - [sst/opencode#45087](https://github.com/sst/opencode/issues/45087) — "Auto-updater ate 266 GB by reinstalling OpenCode every 10 minutes" (open) — an extreme case of an auto-update loop consuming 266 GB through reinstalls, confirming the update pipeline lacks retention/dedup policy;
  - [sst/opencode#33356](https://github.com/sst/opencode/issues/33356) — opencode.db event table growing without limit to 13GB+ (open) and [#41175](https://github.com/sst/opencode/issues/41175) — streaming updates causing storage to balloon by taking a full snapshot per entry (open) — further upstream confirmation of the same "add-only, never remove" storage pattern, though the target is a database rather than the `cli/` version accumulation measured in this dossier;
  - An issue specifically about `cli/` multi-version non-cleanup and the `update.zip`/`pending` dual storage: not found in sst/opencode's GitHub issues as of 2026-09-30; to be confirmed/filed by community contributions.
