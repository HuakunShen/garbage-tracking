---
title: uv
description: The unpacked-wheel cache ~/.cache/uv alone is 36 GB (archive-v0 accounts for 34 GB), with no size cap by default and never auto-cleaned; the whole cache can be wiped, the only cost being on-demand re-downloads
category: devtool
os: [macos]
last-verified: 2026-09-30
---

# uv

uv is Astral's Python package/project manager, designed around "cache everything, never re-download or rebuild". Its cache measured on this machine lives at `~/.cache/uv` (output of `uv cache dir`, uv 0.9.18); in this scan `~/.cache` totaled 39.9 GiB (41,798,644 KiB) and uv alone accounts for 36 GB, of which the unpacked-wheel archive-v0 is 34 GB containing 1,446,226 files (spot-checked this scan with `find | wc -l`, confirming the same number). Conclusion: **about 36 GB is fully recoverable by wiping the whole cache**; uv re-downloads/unpacks on demand afterwards with zero functional loss; no records on the memory side from this machine's scan.

## Disk issues

### macOS

| Path | Type | Measured size | Delete-ability | Notes |
|------|------|----------|----------|------|
| ~/.cache/uv/archive-v0/ | Unpacked-wheel accumulation | 34 GB (2,844 package directories / 1,446,226 files) | Safe (whole cache can be wiped, re-downloaded on demand) | uv unpacks every wheel into a directory of loose files, then hard-links them into each virtual environment; after a package upgrade the old-version entries are never evicted — it only ever grows |
| ~/.cache/uv/simple-v14, simple-v15, simple-v18/ (along with sdists-v6, sdists-v7, wheels-v3) | Cache-format upgrade leftovers | 353 MB (v14 69M + v15 121M + v18 155M, plus v6/v7/v3 totaling about 8M) | Safe | The index has upgraded to simple-v21 (140M); the three old-version directories remain in place untouched — the outdated data is even bigger than the current version, and uv does not delete it itself |
| ~/.cache/uv/.tmp*/ | Interrupted-install leftovers | 9 directories totaling about 210 MB | Safe | The oldest dates from 2025-05-15 (over a year old); temp directories from interrupted installs are never reclaimed |
| ~/.cache/uv/sdists-v9/ | Source-distribution build cache | 806 MB | Safe | Build products from sdists and unpacked sources; `uv cache prune --ci` targets exactly this kind |
| ~/.cache/uv/environments-v2/ | Centralized project environments | 746 MB | Safe (prune clears these too) | uv's centralized environments; the official docs state explicitly that `uv cache prune` "removes … all centralized project environments", rebuilt on demand after deletion |
| ~/.cache/codex-runtimes/ | Install leftovers (belongs to Codex CLI, not uv) | 2.0 GB | Caution (confirm no codex is running first) | Two `codex-runtime-install-*` directories each keep a node-runtime.tar.xz (336,716,888 B ≈ 321M and 173,162,406 B ≈ 165M); the archives were not deleted after extraction |

`~/.cache` also holds caches of other tools such as puppeteer (555 MB) and opencode (512 MB); those belong to their own profiles, see `apps/index.md`.

**Design issue**: uv's caching philosophy is "never expires" — the unpacked files in archive-v0 are reused via hard links (near-zero-copy installs on the same volume), so cache entries are worth keeping forever, but the cost is **no eviction mechanism at all**: every cleanup means the official docs offer is manual (`uv cache clean` / `uv cache prune` / `uv cache prune --ci`), the docs' own wording only suggests it is "safe to run periodically", there is no size cap, no LRU/GC, no background cleanup, and the default is to never prune. Three chained consequences are all visible on this machine: (1) after package upgrades, old entries stay in archive-v0 forever, growing to 34 GB; (2) after index/cache schema upgrades (simple-v14→v21 etc.), old-version directories remain in place (353 MB); (3) interrupted installs leave `.tmp*` directories (9 of them, 210 MB, the oldest uncleared for over a year). Automatic cache GC is an upstream capability that has been requested repeatedly but not yet implemented — specific issue numbers unverified (the search was rate-limited this time, links could not be confirmed, none invented).

### Windows

To be filled in by community contributions (see apps/index.md for path conventions). The official docs state the default cache path is `%LOCALAPPDATA%\uv\cache`; measured data to be added.

### Linux

To be filled in by community contributions (see apps/index.md for path conventions). The official docs state the default cache path is `$XDG_CACHE_HOME/uv` (`$HOME/.cache/uv` when unset); measured data to be added.

## Memory issues

| Process | Pattern | Notes |
|------|------|------|
| No known issues recorded | | This machine's scan has empty memoryNotes; no resident processes or memory-anomaly patterns observed |

## Cleanup recommendations

- **Safe** (no side effects if deleted; the software rebuilds on its own): `uv cache clean` (empties all of `~/.cache/uv`, 36 GB, re-downloaded on demand next time); or start gentler with `uv cache prune` (only removes entries not referenced by any environment, plus centralized environments); manually delete `~/.cache/uv/simple-v14/`, `simple-v15/`, `simple-v18/`, `sdists-v6/`, `sdists-v7/`, `wheels-v3/`, and all `~/.cache/uv/.tmp*/`.
- **Caution** (loses cache or config; rebuilding has a cost; needs user confirmation): `~/.cache/codex-runtimes/` (2.0 GB, Node runtimes belonging to Codex CLI; Codex will re-download on next start; first confirm no codex process is running); `~/.cache/uv/sdists-v9/`, `~/.cache/uv/environments-v2/` (uv rebuilds after deletion, but source builds must rerun and environments must re-sync).
- **Do not delete** (user data): no user data lives inside the cache directories; note that deleting archive-v0 does not affect already-created virtual environments (hard links remain), but project directories on a different volume are not protected by hard links and reinstalling dependencies requires re-downloading. Other tools' directories under `~/.cache` (puppeteer, opencode, etc.) should be handled per their own profiles — do not sweep them in.

## Upstream status

- Official cleanup options: `uv cache clean` (full wipe) / `uv cache prune` (clears unreferenced entries + centralized environments; docs say it can be run manually periodically) / `uv cache prune --ci` (clears pre-built wheels and unpacked sdists, recommended at the end of CI); `UV_CACHE_DIR` can relocate the cache. **There is no automatic cleanup or size cap of any kind by default** (docs.astral.sh/uv/concepts/cache/, verified against the original text this time).
- Related issues/PRs: unverified (the search was rate-limited this time, specific numbers could not be confirmed; the direction is upstream feature requests for automatic cache caps/GC).
