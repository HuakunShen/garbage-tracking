---
title: Arc
description: 1.8 GB of browser cache entirely rebuildable Default profile cache; process tree of 21 processes / RSS 3.7–5.8 GB — Chromium's one-process-per-tab makes it a major non-leaking consumer
category: other
os: [macos]
last-verified: 2026-09-30
---

# Arc

Arc is a Chromium-based browser by The Browser Company, in maintenance mode since May 2025 (development focus has shifted to Dia). Resource profile: mild on the disk side — the largest reclaimable item, `~/Library/Caches/Arc/User Data` at 1.8 GB, is entirely the Default profile's HTTP cache + V8 Code Cache and is rebuilt automatically after deletion; the bulk of `~/Library/Application Support/Arc/User Data` at 1.4 GB is actually 1.0 GB of Service Worker site caches, while real browsing history/login state is only in the hundreds of MB. On the memory side there is no leak but usage accumulates linearly with tab count and session duration: Chromium spawns one renderer per tab, the whole tree is 21 processes, RSS was 3.68 GB at scan time and 5.81 GB on a same-day recheck. Conclusion: **about 1.8 GB of cache can be safely reclaimed; memory is a major but "reasonable and closable" consumer — closing tabs frees it immediately**.

## Disk issues

### macOS

| Path | Type | Measured size | Delete-ability | Notes |
|------|------|----------|----------|------|
| ~/Library/Caches/Arc/User Data/ | Browser cache | 1.8 GB (du recheck 1.7 GiB) | Safe | The whole tree has only one profile, Default: `Default/Cache` 1.2G (HTTP cache) + `Default/Code Cache` 571M (V8 code cache), measured with `du -sh` on 2026-09-30; Arc rebuilds it automatically after deletion, costing only a slower second-load of web pages |
| ~/Library/Application Support/Arc/User Data/Default/Service Worker/ | Site offline cache | 1.0 GB | Caution | Measured with du; it is the overwhelming majority of the App Support side. Sites' own caches stored via the CacheStorage API; rebuilt after web apps re-register their Service Worker, but offline data of installed PWAs may be unrecoverable |
| ~/Library/Application Support/Arc/User Data/ | User data directory | 1.4 GB (scan evidence consistent with du recheck) | Do not delete (user data) | Excluding the 1.0G Service Worker above, real user data is small: IndexedDB 65M, extensions 46M, Local Storage 25M, History 22M, Favicons 10M (measured with du); bookmarks/passwords/login state all live in this tree |

Growth evidence: in the research file (part2-library.md, section 5), a scan in late September showed `~/Library/Caches/Arc` at 1.5G; the 2026-09-30 du recheck measured 1.7G — roughly 200M growth over several days, with no sign of automatic reclamation; it keeps growing with use.

**Design issue**: Arc follows Chromium's standard macOS layout — profile data in Application Support, HTTP cache by convention in `~/Library/Caches/<app>/` (same as Chrome itself; research section 5 measured `Caches/Google` at 817M). Chromium's disk cache is supposed to have a capacity cap and eviction policy; why it piled up to 1.7G on this machine over several days without reclamation — whether the cap scales with available disk space, or Arc never enabled standard eviction — is unverified. No evidence of an automatic cache-clearing option in Arc's settings (unverified); neither the scan evidence nor the research files contain relevant issue links, and no upstream issue search was performed this time.

### Windows

To be filled in by community contributions (path conventions in apps/index.md)

### Linux

To be filled in by community contributions (path conventions in apps/index.md)

## Memory issues

| Process | Pattern | Notes |
|------|------|------|
| Browser Helper (Renderer) | One process per tab / count stacks up | At scan time 12 Renderers totaled 2.58 GB RSS, with lifetimes accumulating one by one from 5 minutes to 1h21m; the 2026-09-30 recheck found 15 `--type=renderer` processes (measured via `ps --type=`), the largest single one 1.49 GB (alive 38m). Whole tree of 21 processes: RSS 3.68 GB (scan) → 5.81 GB (recheck); process count flat while memory keeps climbing |
| Arc (main process) | Resident main process | 612 MB at scan time; recheck showed pid 746, 593 MB, alive 2h03m since boot; plus 4 `--type=utility` and 1 `--type=gpu-process` infrastructure processes, none individually large |

**Design issue**: Caused by Chromium's design of one renderer process per tab (and per webview), not a leak — closing tabs frees it immediately, and RSS accumulates linearly with the number of open sites and time spent on them; Arc wraps this in its own Browser Helper naming via ArcCore.framework. On that day's RSS ranking it tied with VS Code for second place (scan evidence verdict: consistent with the previous day's research verdict on Chrome as a "reasonable but closable major consumer").

## Cleanup recommendations

- **Safe** (no side effects, software rebuilds on its own):
  - `~/Library/Caches/Arc/User Data/` — the whole directory can be deleted; rebuilt automatically on next launch (about 1.8 GB, the largest win in this entry); quit Arc before deleting
- **Caution** (loses cache or configuration, rebuilding has a cost, user confirmation required):
  - `~/Library/Application Support/Arc/User Data/Default/Service Worker/` — 1.0 GB; after deletion site caches rebuild and web apps must re-register, and offline data of installed PWAs may be lost. Safer to use the in-browser "Clear browsing data" (a standard Chromium feature; under Arc the entry point should be arc://settings/clearBrowserData — not tested for this entry, unverified)
- **Do not delete** (user data):
  - Everything in `~/Library/Application Support/Arc/User Data/` except Service Worker — History, Local Storage, IndexedDB, Favicons, Extensions, etc. are browsing history, login state, bookmarks, and the extensions themselves

## Upstream status

- Official cleanup options: no public evidence of automatic cache cleanup / capacity cap settings (unverified); Chromium's standard manual entry "Clear browsing data" should be available (arc://settings/clearBrowserData, untested).
- Upstream developments: Arc has been in maintenance mode since May 2025; The Browser Company pivoted to the AI browser Dia and was later acquired by Atlassian (web search: [superchargebrowser.com](https://www.superchargebrowser.com), [androidauthority.com](https://www.androidauthority.com)); under maintenance mode, cache-policy improvements should not be expected.
- Related issues/PRs: no search was performed this time; no speculative links are listed, unverified.

Evidence files: for the scan evidence summary, research document sources, and local verification command logs, see [evidence-macos-2026-09-30.txt](evidence-macos-2026-09-30.txt).
