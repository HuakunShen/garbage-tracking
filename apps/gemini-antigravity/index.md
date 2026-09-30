---
title: Gemini / Antigravity
description: ~/.gemini totals 2.7 GB — the AI IDE hides a complete 1.6 GB Chromium user data directory in the home directory, plus a 395 MB whole-directory old backup sitting on disk alongside the original
category: ide
os: [macos]
last-verified: 2026-09-30
---

# Gemini / Antigravity

Google's Gemini CLI and Antigravity (an AI IDE) share the `~/.gemini` directory as their root. On this machine the directory totals 2.7 GB (scan 2.69 GiB, `du -sh` recheck 2.7G), and its three largest items are all related to Antigravity's agent browser / agent data: a complete 1.6 GB Chromium user data directory, 408 MB of IDE agent data, and a 395 MB whole-directory old backup. Conclusion: the 395 MB backup duplicates the original's content and can be deleted wholesale (zero loss, about 0.4 GB); browser-profile has had zero writes on this machine for over 5 months — once its abandonment is confirmed, up to about 2 GB can be reclaimed in total; no memory issues on record (spot checks found no resident processes).

## Disk issues

### macOS

| Path | Type | Measured size | Delete-ability | Notes |
|------|------|----------|----------|------|
| ~/.gemini/antigravity-browser-profile/ | Leftover browser profile | 1.6 GB | Caution (apparently abandoned; confirmation needed) | A complete Chromium `--user-data-dir` (ls confirms it contains Default/, Local State, component_crx_cache, extensions_crx_cache, optimization_guide_model_store, Safe Browsing, etc.); the newest file inside has mtime 2026-04-20, with zero writes in the 5+ months since — apparently left behind after a version change |
| ~/.gemini/antigravity-backup/ | Redundant whole-directory backup | 395 MB | Safe (deletable wholesale) | A full-directory snapshot from 2026-09-15 06:13 (annotations/brain/conversations/implicit/knowledge…, every file sharing the same timestamp); conversations measured at 154M in both it and the in-use ~/.gemini/antigravity-ide/conversations — two copies on disk; zero writes to the snapshot since |
| ~/.gemini/antigravity-ide/ | IDE agent data | 408 MB | Caution (partially deletable) | browser_recordings 195M (agent browser session recordings) + conversations 154M (user conversations); still being written on 2026-09-30, an in-use directory |
| ~/.gemini/antigravity/ | Agent data (in use) | 282 MB | Do not delete (user data) | conversations 171M + brain 66M; newest file 2026-09-30, actively in use; listed here only to complete the directory picture |

**Design issue**: two problems stacked. First, Antigravity has a built-in agent browser that, using a separate Chromium `--user-data-dir`, drops an entire set of browser data into `~/.gemini/antigravity-browser-profile`; Chromium profiles naturally bloat (caches, component updates, on-device model downloads), and the browser profile has no total-size management whatsoever. On this machine the directory has had zero writes since 2026-04-20, indicating that after the IDE changed versions the old profile was abandoned wholesale with nothing reclaiming it (whether this is because the IDE switched profile paths is unverified). Second, the agent data directory has a "whole-directory snapshot" mechanism: at 2026-09-15 06:13, `antigravity-backup` was generated, a copy of the in-use `antigravity-ide` (identical per-directory timestamps, conversations the same size) — looking like a one-off snapshot taken before an upgrade/migration — but the snapshot is never cleaned up and sits on disk alongside the original long-term (which component creates the snapshot and whether any retention policy exists is unverified).

### Windows

To be filled in by community contributions (path conventions in apps/index.md)

### Linux

To be filled in by community contributions (path conventions in apps/index.md)

## Memory issues

No known issues recorded. (The scan did not collect memory data; a 2026-09-30 `ps aux | grep -iE 'antigravity|gemini'` spot check found no resident Antigravity/Gemini processes — the only match was an unrelated Google Drive crashpad.)

## Cleanup recommendations

- **Safe** (no side effects, software rebuilds on its own):
  - `~/.gemini/antigravity-backup/` in its entirety (395 MB) — a whole-directory snapshot from 2026-09-15 whose content duplicates the in-use `~/.gemini/antigravity-ide/`; the originals are all intact; if you want to keep the historical snapshot from before September 15, verify it yourself before deleting.
- **Caution** (loses cache or configuration, rebuilding has a cost, user confirmation required):
  - `~/.gemini/antigravity-browser-profile/` (1.6 GB) — zero writes on this machine for over 5 months, apparently abandoned; after deletion the browser agent will rebuild the profile the next time it is used, but login state/cookies inside that profile are lost; recommended to confirm the current IDE version no longer points to this path before deleting;
  - `~/.gemini/antigravity-ide/browser_recordings/` (195 MB) — agent browser session recordings; deletion loses the replays;
  - `~/.gemini/tmp/` (18 MB) — temp directory, clearable after closing the IDE.
- **Do not delete** (user data):
  - `~/.gemini/antigravity/` (282 MB) and `~/.gemini/antigravity-ide/conversations/` — the in-use agent conversation history and brain memory (still being written on 2026-09-30);
  - `~/.gemini/settings.json`, `~/.gemini/oauth_creds.json`, `~/.gemini/google_accounts.json`, `~/.gemini/jetski-standalone-oauth-token` — configuration and login credentials;
  - `~/.gemini/GEMINI.md`, `~/.gemini/skills/`, `~/.gemini/extensions/`, `~/.gemini/config/`, `~/.gemini/history/` — user instructions, skills, and configuration.

## Upstream status

- Official cleanup options: unverified — no cleanup command, retention setting, or automatic reclamation toggle for `antigravity-browser-profile` or `antigravity-backup` was found in the documentation/settings.
- Related issues/PRs: the 2026-09-30 search found no directly verifiable upstream issue links; to be filled in by community contributions.
