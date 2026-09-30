---
title: Yarn (Berry)
description: The global package cache has grown to 3.4 GB, in-only-never-out, coexisting with npm/_cacache (21G) and pnpm-store (868M) as three parallel caches — all can be wiped and rebuilt on demand
category: devtool
os: [macos]
last-verified: 2026-09-30
---

# Yarn (Berry)

Yarn Berry (Yarn 2+) is Yarn's modern package manager, which by default puts the shared package cache of all projects in `~/.yarn/berry`. The resource problem is a single, classic "package cache that only ever grows": the global cache stores zips keyed by "package-version-checksum", 4,240 zips have piled up to 3.4 GB, the oldest file traces back to 2025-01-30, and it has never shrunk in between. Conclusion: these 3.4 GB can be safely wiped in full and rebuilt on demand, and the `yarn` command can no longer even be found on this machine's PATH (`command -v yarn` returns nothing — likely invoked via corepack/another tool, unverified) — the cache is pure legacy growth; no resident processes, so no memory issue.

## Disk issues

### macOS

| Path | Type | Measured size | Delete-ability | Notes |
|------|------|----------|----------|------|
| ~/.yarn/berry/cache/ | Global package cache, grows only | 3.1 GB | Safe (can be wiped, rebuilt on demand) | 4,240 zips / 2,652 packages, about 37% are old versions of the same package; typescript alone stores 9 versions totaling 293 MB |
| ~/.yarn/berry/metadata/ | Metadata cache accumulation | 332 MB | Safe (npm registry metadata, re-fetched on demand) | npm registry HTTP metadata cache, likewise grows-only |

**Design issue**: Berry defaults to `enableGlobalCache: true`, putting cache files into the `globalFolder` (default `~/.yarn/berry`) — the moment any project's `yarn install` first references a package version, an immutable zip is permanently written into the global cache. Cache entries are immutable (content-addressed: package-version-hash-checksum), and upstream offers no TTL, capacity cap, or background GC: with no eviction policy, the cache only grows monotonically with the number of projects and dependency versions. The only official means is the manual full wipe `yarn cache clean --mirror/--all` (see "Upstream status" below). Evidence of the accumulation: commander ×10, @babel/types ×10, ws/typescript/type-fest ×9 versions each coexisting; the oldest zip mtime is 2025-01-30, the newest 2026-09-22 — about 20 months of growth with no shrink. Together with npm's `~/.npm/_cacache` (21G) and pnpm's `~/.pnpm-store-local` (868M), it forms three mutually non-sharing JS package caches, so the same set of packages can be stored up to three times.

### Windows

To be filled in by community contributions (see apps/index.md for path conventions)

### Linux

To be filled in by community contributions (see apps/index.md for path conventions)

## Memory issues

No known issues recorded (the scan evidence `memoryNotes` is empty; Berry is a CLI tool with no resident processes/helpers. This machine's `ps`/`top` found no yarn-related process entries)

## Cleanup recommendations

- **Safe** (no side effects if deleted; the software rebuilds on its own): `yarn cache clean --all` (equivalent to emptying `~/.yarn/berry/cache/` 3.1 GB + `~/.yarn/berry/metadata/` 332 MB, 3.4 GB combined). The next `yarn install` in any project re-downloads the needed versions per the lockfile; `enableGlobalCache` is on by default, so the cache rebuilds automatically.
- **Caution** (loses cache or config; rebuilding has a cost; needs user confirmation): this profile found no Yarn paths needing this tier — under `~/.yarn`, aside from cache/metadata, only a 0 B `~/.yarn/bin/` and a 4 KB telemetry file remain, with no config or user data mixed into the cache directories.
- **Do not delete** (user data): `~/.yarn/berry/telemetry.json` (4 KB, local usage data); `~/.yarn/bin/` (the global bin install location, currently 0 B, reserved for `yarn global`/`yarn dlx` links).

## Upstream status

- Official cleanup options: the `yarn cache clean` docs page (https://yarnpkg.com/cli/cache/clean, verified 2026-09-30) — "Remove the shared cache files"; `--mirror` clears the global cache and `--all` clears global + project-local caches, all one-shot full wipes with no per-entry cleanup. The configuration docs (https://yarnpkg.com/configuration/yarnrc, verified the same day) confirm `enableGlobalCache` defaults to `true`, `globalFolder` defaults to `${HOME}/.yarn/berry`, and no automatic GC / capacity cap / TTL settings are offered.
- Related issues/PRs: unverified — a search of the yarnpkg/berry issue tracker could not locate a canonical issue pointing to "no garbage collection for the global cache" (yarnpkg/berry#6368, which the search hit, was fetched and verified to be a different problem — "write-only network shares causing chmod/rename failures" — unrelated to this topic and not adopted).

Evidence files: scan evidence and spot-check recheck records are in [evidence-macos-2026-09-30.txt](evidence-macos-2026-09-30.txt).
