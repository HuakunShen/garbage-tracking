---
title: pnpm
description: Three generations of store formats coexist totaling 26.5 GB, the largest single body in ~/Library after Xcode; ≈10.4 GB confirmed zero-loss recoverable (≈13.7 GB including the leftover on an external volume), and the active store's additional 18 GB is rebuildable as a cache
category: devtool
os: [macos]
last-verified: 2026-09-30
---

# pnpm

pnpm is a Node.js package manager known for its global content-addressable store + hard-link deduplication: every project's dependency files are hard-linked back to a single shared repository, and the store itself lives at `~/Library/pnpm/store` (the macOS default). Measured on this machine, under that store **three generations of formats — v3 / v10 / v11 — coexist totaling 26.5 GB**, the largest single body in `~/Library` after Xcode (research measured `du -sk` = 28,040,204 KiB ≈ 26.74 GiB / 28.71 GB). Unlike the scan evidence's conclusion that "all three are leftovers and the whole directory is recoverable at 27.7 GB", this item-by-item spot check **corrects** it as follows: v3 (8.4 GB) is indeed a deletable leftover; but v10 (1.1 GB) is the default store of pnpm 10.24.0 on the PATH (372 registered projects) and v11 (17 GB) is still being written to on the day of scanning by projects pinned by corepack to pnpm 11.x (83 registered projects) — both are **active caches** — deleting them does not break existing projects (hard links), but the cost is that the related projects fully re-download on their next install. Zero-loss recovery ≈10.4 GB (within the home directory), ≈13.7 GB after adding the old-format store on an external volume; no records on the memory side.

## Disk issues

### macOS

| Path | Type | Measured size | Delete-ability | Notes |
|------|------|----------|----------|------|
| ~/Library/pnpm/store/v3/ | Old-format store leftover | 8.4 GB | Safe (old format) | The v3 format from the pnpm ≤8 era; current pnpm 9/10/11 neither reads nor writes it; of the measured 364,450 files, only 1,584 have an mtime changed after 2026-09 (a hard-link side effect, not real writes), and directory-level activity stopped at 2026-04 |
| ~/Library/pnpm/store/v11/ | Active store (pnpm 11.x) | 17 GB | Caution (active cache) | 83 projects register symlinks, the newest created at 07:22 on the day of the scan, and `index.db` (143,200,256 bytes) was updated that day; projects pointing to `.codex/worktrees/*` pin `pnpm@11.15.1` in their package.json. Deletion does not break existing node_modules, but the related projects fully re-download on their next install |
| ~/Library/pnpm/store/v10/ | Active store (pnpm 10.x default) | 1.1 GB | Caution (active cache) | `pnpm store path` (10.24.0 on the PATH) is exactly this path; 372 project symlinks, with the registry still updated on 2026-09-29; small in size — `pnpm store prune` is recommended instead of deleting the whole directory |
| ~/Library/Caches/pnpm/ | Download/metadata cache | 1.2 GB | Safe | The official cache directory (`~/Library/Caches`), rebuilt automatically by pnpm |
| ~/.pnpm-store-local/ | Standalone old-format store | 868 MB | Safe (old format) | Another v3 store at the root of $HOME, coexisting in the same format as `~/Library/pnpm/store/v3`; last written 2026-07-20, no longer used by any current-generation pnpm |
| /Volumes/<data disk>/.pnpm-store/v3, v10/ | Old-format portion of the external-volume store | 6.4 GB (v3 3.2 + v10 3.2) | Safe (v3) / Caution (v10) | pnpm picks the store automatically by the volume a project lives on (hard links cannot cross filesystems), and external-volume projects use the volume-root `.pnpm-store`; v3 has had no writes since 2025-03, and v10 has had none since 2026-02 but remains the designated store of this volume's pnpm 10; the active v11 on the same volume occupies another 8.3 GB (whole volume measured 15 GB) |

**Design issue**: (1) the store changes format directory name by major version (v3→v10→v11), and **old-format directories are never migrated and never automatically deleted** — every generation's upgrade leaves a complete copy in place; this machine has three generations coexisting at 26.5 GB, and `pnpm store prune` only acts on the "current generation" store, never touching old-format directories. (2) corepack's per-project `packageManager` pinning keeps multiple generations of pnpm active simultaneously (measured: corepack cache coexists 10.20.0 / 10.28.2 / 11.4.0 / 11.5.2 / 11.15.1 / 11.25.0, and `~/Library/pnpm/.tools/pnpm` holds another 40 self-managed version directories totaling 424 MB), so "delete the old store after upgrading" is not always safe — you must first confirm no project is still pinned to the old generation. (3) pnpm **picks the store per volume** (hard links are unavailable when the project and home are on different filesystems, so it automatically creates `.pnpm-store` at the volume root): one set in home plus one on an external volume on this machine, doubling the total; measured, running `pnpm store path` under `/Volumes/<data disk>/ExtDev` returns the volume-root store while under `$HOME` it returns `~/Library/pnpm/store/v10`, and `pnpm config get store-dir` = undefined (no user configuration at all; this is built-in behavior). (4) The only official cleanup means is the manual `pnpm store prune` (measured `pnpm store --help`: "Removes unreferenced (extraneous, orphan) packages from the store. Pruning the store is not harmful, but might slow down future installations"); there is no capacity cap, retention period, or automatic GC; the pnpm 11 generation's `index.db` (measured 143 MB) is a new metadata database that keeps growing as projects register. Related upstream issue links: unverified (neither the research files nor this machine's evidence contains specific numbers; none fabricated).

### Windows

To be filled in by community contributions (path conventions in apps/index.md)

### Linux

To be filled in by community contributions (path conventions in apps/index.md)

## Memory issues

No known issues recorded (the scan evidence's memoryNotes is empty; pnpm is a short-lived CLI and does not stay resident in the background)

## Cleanup recommendations

- **Safe** (no side effects from deletion; the software rebuilds it itself):
  - `rm -rf ~/Library/pnpm/store/v3` — old-format leftover (8.4 GB); current pnpm 9/10/11 neither reads nor writes it; zero impact after deletion;
  - `rm -rf ~/.pnpm-store-local` — the standalone v3 store at the root of $HOME (868 MB), same as above;
  - `rm -rf ~/Library/Caches/pnpm/*` — download/metadata cache (1.2 GB), rebuilt automatically by pnpm on demand;
  - External volume `<data disk>/.pnpm-store/v3` — the old-format store on that volume (3.2 GB), no writes since 2025-03.
- **Caution** (caches or config are lost, rebuilding has a cost, needs user confirmation):
  - `pnpm store prune` — a gentle cleanup of the active store (removes orphan packages not referenced by any project); note that prune only acts on the current generation: pnpm 10 on the PATH cleans `~/Library/pnpm/store/v10` (1.1 GB), and you need to run it again with corepack's pnpm 11 to clean `v11` (17 GB);
  - Deleting `~/Library/pnpm/store/v11` or `v10` outright: will not damage any existing project (node_modules are hard links, the data remains), but the 83 + 372 registered projects need a full re-download on their next `pnpm install` — for projects you will keep developing soon, prune only rather than delete;
  - External volume `<data disk>/.pnpm-store/v10` (3.2 GB): dormant (no writes since 2026-02) but still the designated store of this volume's pnpm 10 projects; after deletion those projects need to re-download on their next install.
- **Do not delete** (user data/functional components):
  - The `pnpm`, `pnpx` launcher scripts and `global/` (globally installed packages) under `~/Library/pnpm/` — deleting them disables pnpm itself and the global packages;
  - `~/Library/pnpm/.tools/` (40 self-managed pnpm versions, 424 MB) and `~/Library/pnpm/store/v11/`, external-volume `.pnpm-store/v11/` (8.3 GB, active) — see above, active stores;
  - The project directories that the store's `projects/` symlinks point to, such as `.codex/worktrees/*`, are working copies belonging to their own apps' dossier scope — do not let a pnpm cleanup sweep them up along the way.

## Upstream status

- Official cleanup options: manual commands `pnpm store prune` (removes unreferenced packages), `pnpm store prune --force` (also removes "alien directories"), `pnpm store status` (validation), `pnpm store path` (measured from `pnpm store --help` output, 10.24.0); **no automatic cleanup option** — no capacity cap, no time-based eviction, no cross-version old-store reclamation, and prune does not handle old-format directories (a mechanism-level conclusion, drawn from documented CLI behavior and this machine's measured three-generation coexistence state).
- Related issues/PRs: community discussion about "old-format stores never being cleaned after upgrades and multiple generations coexisting" ought to exist, but this dossier has not verified specific numbers — unverified (no links fabricated).

Evidence file: for measured command output and provenance records, see [evidence-macos-2026-09-30.txt](evidence-macos-2026-09-30.txt).
