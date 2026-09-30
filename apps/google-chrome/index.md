---
title: Google Chrome
description: Old and new framework versions coexist inside the app bundle (the 712M old version is reclaimable), plus a 745M GoogleUpdater installer cache and 1.2G of browser cache — about 2.7 GB safely clearable; another 1.3G of Service Worker site cache on the side
category: other
os: [macos]
last-verified: 2026-09-30
---

# Google Chrome

Google Chrome is Google's Chromium-family browser. Its disk problems fall into two categories: first, **version pileup** — after the updater writes the new framework version (154.0.8037.58) into the .app, the old complete framework (153.0.8010.53, measured 712M with `du -sh`) lingers uncollected, and the app bundle has grown accordingly from 719M (research, measured 2026-09-27) to 1.4G (rechecked 2026-09-30); second, **installer/browser caches** — GoogleUpdater's crx_cache at 745M and Caches/Google at 1.2G. The three together total about 2.7 GB safely clearable. The caution tier additionally holds the Service Worker site cache at 1.3G and the Google Drive desktop sync cache (DriveFS whole tree 4.4G, of which content_cache is 3.6G — it was only 992M at scan time, growing markedly). Memory is Chromium's typical multi-process pattern: `ps` measured 2026-09-30 showed 17 processes / 2.37 GB RSS, no leak.

## Disk issues

### macOS

| Path | Type | Measured size | Delete-ability | Notes |
|------|------|----------|----------|------|
| /Applications/Google Chrome.app/Contents/Frameworks/Google Chrome Framework.framework/Versions/153.0.8010.53/ | Version pileup | 712M | Safe (wait for the updater to reclaim) | Old complete framework; `ls` shows 153 and 154 coexisting under Versions/, with `Current → 154.0.8037.58`. A day after the 9/29 upgrade, 153 is still there — the direct cause of the .app growing from 719M to 1.4G |
| ~/Library/Application Support/Google/GoogleUpdater/crx_cache/ | Installer cache | 745M | Safe | CRX installer package cache downloaded by the updater, pure garbage; the GoogleUpdater tree is 775M, almost entirely this |
| ~/Library/Caches/Google/ | Browser cache | 1.2G | Safe | Almost entirely `Caches/Google/Chrome/Default` (HTTP disk cache), rebuilt automatically while browsing after deletion; measured 817M on 9/27 → 1.2G by 9/30, growing steadily |
| ~/Library/Application Support/Google/Chrome/extensions_crx_cache/ + component_crx_cache/ | Installer cache | 184M + 103M ≈ 287M | Safe | CRX package caches of extensions/components, downloaded and discarded after install; Chrome re-downloads when needed; recommend quitting Chrome before deleting |
| ~/Library/Application Support/Google/Chrome/Default/Service Worker/ | Site cache storage | 1.3G | Caution | Offline resources sites store via the Cache Storage API; after deletion sites are slower on first load and offline features reset — one of the major items of the 3.8G Chrome profile tree (Default 3.1G) |
| ~/Library/Application Support/Google/DriveFS/ | Sync cache | 4.4G (2026-09-30 recheck) / 992M (at scan time) | Caution | Google Drive desktop's cache: content_cache 3.6G + two sets of SQLite (metadata/mirror, roughly 191M/179M each, plus a WAL of 176M each). At scan time the whole directory was only 992M; it grew to 4.4G within a week. Filed under the Chrome entry because the scan grouped all Google apps together; strictly speaking this is the standalone Drive app's data |

Also: under the Chrome profile, `SODALanguagePacks` 194M (Live Caption speech packs), `optimization_guide_model_store` 71M (on-device AI models), and other components — small enough that they are not listed separately for now (measured with `du -sh` on 2026-09-30).

**Design issues**:
- **Version pileup**: when GoogleUpdater (the successor to Keystone) updates Chrome, it unpacks the new version in full into `Google Chrome Framework.framework/Versions/<version>/` and then flips the `Current` symlink to the new version; by design the old version directory should be deleted by the updater after the browser's next successful launch. Measured on this machine: research measured the .app at just 719M (single version) on 9/27, 154 was installed on 9/29, and on the 9/30 recheck 153's 712M was still there — reclamation lagged by at least a day. Whether a full quit and restart is required to trigger it, and whether there is a retry after failure, is unverified. Mechanically, each version is a complete framework (about 713M each), so one leftover old version doubles the size.
- **GoogleUpdater crx_cache**: the updater keeps downloaded installer packages in crx_cache; the purpose of keeping them is as a diff baseline for incremental updates and for repair reinstalls; measured 745M with no automatic cleanup observed. Whether any retention policy (count/age cap) exists is unverified.
- **Caches/Google**: Chromium's standard HTTP disk cache, LRU eviction, no fixed small cap; under long-term use it stabilizes at the GB scale; the official entry point is "Clear browsing data" in settings.
- **Service Worker**: websites (commonly PWAs / online docs) write offline resources into the profile's `Default/Service Worker/CacheStorage`; it is reclaimed only when the site itself cleans up or the user clears "Cookies and other site data" in settings; the aggregate size grows with the number of sites visited, with no automatic reclamation at the browser level by default (per-site storage quota mechanism, unverified).
- **DriveFS**: streaming sync caches the content of opened files into content_cache on demand; growing from 992M at scan time to 4.4G shows the cache only takes in and never lets out; whether the cache size can be limited in Drive preferences is unverified.

### Windows

To be filled in by community contributions (path conventions in apps/index.md)

### Linux

To be filled in by community contributions (path conventions in apps/index.md)

## Memory issues

| Process | Pattern | Notes |
|------|------|------|
| Google Chrome multi-process tree | Multi-process / count stacks up | Measured 2026-09-30 with `ps -axo rss=,comm=`: 17 processes, 2.37 GB RSS in total — main process 378 MB, 10× Chrome Helper (Renderer) totaling 1,597 MB (highest single _renderer about 300 MB), 5× Chrome Helper (GPU/network/audio/storage/utility) totaling 443 MB, crashpad 7 MB. One set of renderer processes per site/tab, usage growing near-linearly with open pages, no leak evidence; the scan's memoryNotes was empty, and this row's data comes from this entry's own ps recheck |

**Design issue**: Chromium's site isolation sets the memory floor = process count × per-process baseline (about 60–100 MB); a few dozen tabs easily reach GBs — this is the inherent cost of the browser's multi-process architecture, not a leak; Chrome's own tab sleeping (Memory Saver) can reclaim background renderers. Whether leak-type growth exists: no evidence seen on this machine, unverified.

## Cleanup recommendations

- **Safe** (no side effects, software rebuilds on its own):
  - Fully quit and restart Chrome so the updater reclaims `Versions/153.0.8010.53/` (712M); if it is still not reclaimed several days after the restart, handle it manually under the caution tier
  - `~/Library/Application Support/Google/GoogleUpdater/crx_cache/` — the whole directory can be deleted (745M); the updater re-downloads when needed
  - `~/Library/Caches/Google/` — the whole directory can be deleted (1.2G); the browser cache rebuilds automatically; deleting while Chrome is running may throw errors, so quit first
  - `~/Library/Application Support/Google/Chrome/extensions_crx_cache/`, `component_crx_cache/` — discard-after-install package caches (287M); delete after quitting Chrome
- **Caution** (loses cache or configuration, rebuilding has a cost, user confirmation required):
  - `~/Library/Application Support/Google/Chrome/Default/Service Worker/` (1.3G) — Chrome's built-in "Clear browsing data" is preferable; after deleting the directory directly, sites are slower on first load and offline features reset, and a few sites may require logging in again
  - `~/Library/Application Support/Google/DriveFS/content_cache/` (3.6G) — quit the Drive desktop app first, then delete; already-cached files re-download afterwards; do not touch the sibling metadata/mirror SQLite databases
  - Manually deleting `Versions/153.0.8010.53/` — `Current` already points to 154, so deletion does not affect operation; but whether modifying the .app bundle's contents triggers Chrome's integrity-check warning is unverified
- **Do not delete** (user data):
  - Everything under `~/Library/Application Support/Google/Chrome/Default/` except Service Worker — bookmarks, history, passwords, cookies, extension configuration (Default totals 3.1G, mostly user data)
  - `metadata_sqlite_db*`, `mirror_metadata_sqlite.db*` under `~/Library/Application Support/Google/DriveFS/` — sync state databases; deleting them requires a full index rebuild
  - The in-use version at `Versions/Current → 154.0.8037.58` inside the .app bundle

## Upstream status

- Official cleanup options: "Clear browsing data" (cache/site data) in Chrome settings is the only official entry point; GoogleUpdater has no user-visible cache cleanup entry (whether chrome://components provides one is unverified); the DriveFS official support docs describe a post-quit cache cleanup procedure, which was not verified against the original text this time — unverified.
- Related issues/PRs: this entry is based on local read-only measurements and the research file; no upstream issue search was performed. Whether public issues exist for the old-version directory reclamation lag or the crx_cache retention policy is unverified.

Evidence files: for the scan evidence summary, research document sources, and local verification command logs, see [evidence-macos-2026-09-30.txt](evidence-macos-2026-09-30.txt).
