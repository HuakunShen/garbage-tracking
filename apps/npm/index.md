---
title: npm
description: "A big disk consumer but entirely regenerable cache: ~/.npm totals 32.05 GiB, _cacache 21 GB is write-only with no eviction, _npx has piled up 168 one-off install directories totaling 11 GB"
category: devtool
os: [macos]
last-verified: 2026-09-30
---

# npm

npm is Node.js's default package manager, and `~/.npm` is its cache root (on this machine `npm config get cache` returns `~/.npm`, version 11.9.0). In this machine's HOME directory audit, `.npm` ranked as the third-largest directory at 31.98 GiB (research measured 33,537,300 KiB; the scan evidence shows 32.05 GiB / 33,614,584 KiB — the two measurements were taken at different times), behind only `.codex` and `.cache`; together with `~/.cache` it accounts for 51.7% of the entire audit scope. The problem picture: the directory contains **no user data at all — it is entirely regenerable cache** — the content-addressed cache `_cacache` at 21 GB only grows and never shrinks, and `_npx` has accumulated 168 one-off install directories totaling 11 GB. Conclusion: about 32 GB is almost entirely safely recoverable (`npm cache clean --force` + emptying `_npx`); the only cost is re-downloading on demand next time; npm does not keep any background process running, and there are no memory issue records.

## Disk issues

### macOS

| Path | Type | Measured size | Delete-ability | Notes |
|------|------|----------|----------|------|
| ~/.npm/_cacache/ | Content-addressed cache that only grows | 21 GB | Safe | Metadata and tarballs of every downloaded package are archived by content hash; npm has no automatic eviction whatsoever — it grows monotonically with install activity only |
| ~/.npm/_npx/ | One-off install accumulation | 11 GB (168 directories) | Safe | Each distinct `npx <pkg>` install spec gets its own `<hash>` directory, each with a full node_modules; multiple versions of the same package coexist in full and are never cleaned |
| ~/.npm/_prebuilds/ | Prebuilt binary cache | 27 MB | Caution | Prebuilt artifacts for native modules; after deletion the next install requires re-downloading |
| ~/.npm/_libvips/ | Prebuilt binary cache | 6.3 MB | Caution | libvips prebuilt artifacts for image libraries such as sharp; same as above |
| ~/.npm/_logs/ | CLI run logs | 80 KB | Safe | One debug log per command; small but only grows |

**Design issue**: (1) `_cacache` uses the cacache content-addressed store, where entries are independent of each other and matched by hash — this is a correct design; the problem is that npm has **no automatic eviction policy based on time or total capacity** — no GC, no LRU, no cap; the cache only grows. Officially there is `npm cache clean --force` (wipe everything) and `npm cache verify` (validate the index and reclaim unreferenced content), but both require manual triggering and never run by default. (2) The `_npx` problem is more typical: npx hashes the install spec (package name + version) into a directory name, runs a full npm install inside that directory, and produces a standalone node_modules; different version specs of the same package get different hashes and share no files. Measured on this machine: `_npx/ebf017b61addb8bd` (package.json declares `@deepseek-ai/dsh ^0.1.7-alpha.2`, node_modules 596M) and `_npx/750cc96126099c02` (declares `^0.1.6-alpha.2`, node_modules 558M) coexist — just those two alpha versions of this one package occupy 1.1 GB; the 15 largest of the 168 directories all exceed 200 MB. npm (as of 11.9.0 on this machine) has no command or automatic eviction mechanism for cleaning `_npx`; the directory only grows. Related upstream issue numbers: unverified (no links fabricated).

### Windows

To be filled in by community contributions (path conventions in apps/index.md)

### Linux

To be filled in by community contributions (path conventions in apps/index.md)

## Memory issues

No known issues recorded (the scan evidence's memoryNotes is empty; npm is a short-lived CLI and does not stay resident in the background)

## Cleanup recommendations

- **Safe** (no side effects from deletion; the software rebuilds it itself):
  - `npm cache clean --force` — empties all of `~/.npm/_cacache/` (21 GB); the next install re-downloads automatically;
  - `rm -rf ~/.npm/_npx/*` — clears all 168 one-off install directories (11 GB); the next `npx <pkg>` reinstalls on demand. Together these reclaim nearly all 32 GB;
  - `~/.npm/_logs/` — pure debug logs (80 KB), safe to delete at any time;
  - Gentler alternative: `npm cache verify` only reclaims orphan content unreferenced by the index, without discarding the hot cache.
- **Caution** (caches or config are lost, rebuilding has a cost, needs user confirmation): `~/.npm/_prebuilds/` (27 MB) and `~/.npm/_libvips/` (6.3 MB) — prebuilt binaries for native modules; after deletion the next install of the relevant packages requires re-downloading or local compilation; small in size, usually not worth cleaning separately.
- **Do not delete** (user data): there is no user data inside `~/.npm`, so there is nothing that needs to be preserved; configuration lives in `~/.npmrc`, and globally installed packages live in the node install prefix's `lib/node_modules` (not in `~/.npm`). When cleaning, be careful not to accidentally delete the node global prefix directory.

## Upstream status

- Official cleanup options: `npm cache clean --force` (wipe everything; `--force` is required), `npm cache verify` (validates the index + GCs unreferenced content; the officially recommended gentler option); npx has **no** cleanup command of any kind — `_npx` can only be deleted manually (the above are documented npm CLI behaviors, and beyond confirming command existence the directory state was verified on this machine's 11.9.0; the absence of an automatic eviction policy is a mechanism-level fact).
- Related issues/PRs: long-running community discussion exists in the npm/cli repo about `_npx` directories never being cleaned and the cacache cache having no automatic eviction; this dossier has not verified specific numbers — unverified (no links fabricated).

Evidence file: for measured command output and provenance records, see [evidence-macos-2026-09-30.txt](evidence-macos-2026-09-30.txt).
