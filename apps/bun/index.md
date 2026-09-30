---
title: Bun
description: Pure cache buildup of about 6.2 GB reclaimable with zero loss — the download cache is 4.2 GB and never auto-cleans, and the 2.0 GB build cache even keeps WebKit ASan debug builds
category: devtool
os: [macos]
last-verified: 2026-09-30
---

# Bun

Bun is an all-in-one JavaScript/TypeScript toolchain written in Zig (runtime + package manager + bundler + test runner) with its data concentrated in `~/.bun`. Measured on this machine, `~/.bun` is 6.8 GB, of which about 6.2 GB is pure re-downloadable/rebuildable cache: the package download cache is 4.2 GB piling up with no cap, and the 2.0 GB build cache even keeps intermediate artifacts of pure Bun source compilation such as WebKit's arm64-debug-asan (ASan-instrumented) debug build at 1.3 GB and the plain debug build at 642 MB, while the truly essential `bin` is only 59 MB. Conclusion: clearing install/cache + build-cache reclaims about 6.2 GB with zero functional loss (severity: medium-high); on the memory side there is no resident background process, no known issues.

## Disk issues

### macOS

| Path | Type | Measured size | Delete-ability | Notes |
|------|------|----------|----------|------|
| ~/.bun/install/cache/ | Package download cache buildup | 4.2 GB | Safe | 5,171 top-level entries (content-addressed, including scoped packages); no TTL, no size cap, no automatic eviction, grows only; after deletion the next `bun install` re-downloads automatically |
| ~/.bun/build-cache/ | Build intermediate artifacts | 2.0 GB | Safe (if you no longer compile Bun from source locally) | webkit-arm64-debug-asan 1.3G + webkit-arm64 642M + C dependency source tarballs 95M (boringssl/brotli/libarchive/libjpeg-turbo/libwebp etc.) + nodejs-headers 1.5M, all inputs/artifacts of building Bun itself |
| ~/.bun/install/global/ | Globally installed packages | 527 MB | Caution | The global CLI tools installed via `bun add -g`; deleting them breaks the corresponding global commands |

`~/.bun` top level measured (from this command's output): install 4.7G, build-cache 2.0G, bin 59M, _bun 48K, totaling 6.8G.

**Design issues**:

1. **Download cache only takes in, never lets out**: `bun install` unpacks a copy of every package@version it has installed into the content-addressed cache, shared by later projects. The cache has no eviction mechanism at all — no TTL, no capacity cap, no LRU — every historical version ever installed is kept forever (the 5,171 entries on this machine are the cumulative evidence). Cleanup is manual only: `bun pm cache rm` (built into bun 1.4.2; the `bun pm --help` text says "clear the cache"), but there is no automatic or scheduled cleanup path whatsoever.
2. **Build cache exclusively serves Bun source development**: Bun's official repository build scripts cache the precompiled WebKit/JavaScriptCore artifacts and C dependency source packages in `~/.bun/build-cache` for reuse in incremental builds; debug and ASan (AddressSanitizer) variants are kept as well and never cleaned. These artifacts are only useful in the "compile Bun from source locally" scenario and are never needed to run bun. Which specific build wrote them on this machine is unverified; the tarballs directory contains only source packages of C dependencies needed to compile Bun, pointing to the Bun source build pipeline.

### Windows

To be filled in by community contributions (path conventions in apps/index.md)

### Linux

To be filled in by community contributions (path conventions in apps/index.md)

## Memory issues

No known issues recorded. A spot check of `ps` on this machine found no bun resident/daemon process (2026-09-30, `ps aux | grep '[b]un '` matched only unrelated processes); bun runs on demand per command-line invocation, and the scan's `memoryNotes` was empty.

## Cleanup recommendations

- **Safe** (no side effects, software rebuilds on its own):
  - `~/.bun/install/cache/` — or simply use the official `bun pm cache rm`; installed projects' node_modules and the cache are separate files (spot-checked on this machine: inode links=1, not hard-link shared), so deleting the cache does not affect existing projects; only the next install needs to re-download.
  - `~/.bun/build-cache/` — provided you no longer compile Bun from source locally; if you later want to build, the build scripts will re-fetch the tarballs and WebKit artifacts.
- **Caution** (loses cache or configuration, rebuilding has a cost, user confirmation required):
  - `~/.bun/install/global/` — first run `ls ~/.bun/install/global/node_modules` or `ls ~/.bun/bin` to see which global CLIs are installed (527 MB on this machine), and uninstall only the ones you no longer need.
- **Do not delete** (user data):
  - `~/.bun/bin/` (the bun binary itself, 59 MB) and `~/.bun/_bun/`.

## Upstream status

- Official cleanup options: `bun pm cache rm` (clears the download cache; listed in bun 1.4.2's `bun pm --help`, confirmed to exist on this machine). **There is no cleanup command at all for build-cache**; delete the directory manually. According to Bun docs/community material, bunfig.toml can set `[install.cache] disable = true` to turn off the global cache (this setting was not tested on this machine).
- Related issues/PRs: the lack of automatic cache eviction is a long-reported problem, but this search (2026-09-30, search was rate-limited) did not obtain a verifiable specific issue link — unverified; no issue numbers are fabricated here.

Evidence files: raw scan JSON in [evidence-macos-2026-09-30.json](evidence-macos-2026-09-30.json); verification command log for this entry in [evidence-macos-2026-09-30.txt](evidence-macos-2026-09-30.txt).
