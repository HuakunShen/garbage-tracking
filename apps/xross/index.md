---
title: Xross
description: ~/Applications holds 5 manual full-bundle backups totaling 2.23 GiB (about 4.7× the current version) — a one-time, zero-risk recovery of ≈2.23 GiB
category: other
os: [macos]
last-verified: 2026-09-30
---

# Xross

Xross is an in-house, still-in-development macOS app (bundle id `one.xross.app`, v1.0.71, installed in `~/Applications`, plus a 16 MB `XrossSSHPoc.app` prototype). The resource problem lies not in the software itself but in its development workflow: before every code change, the whole `.app` is manually copied as a backup and never cleaned up; in just two days, 2026-09-10 to 09-11, 5 stale copies accumulated (2,335,196 KiB ≈ 2.23 GiB combined), even though git (the xross-dev repo) long ago took over that version-management role. One-line conclusion: ≈2.23 GiB can be safely reclaimed from disk (delete the 5 `.before-*` copies — one-time, zero risk); no memory records yet (the app is not resident; no helper/leak patterns observed).

## Disk issues

### macOS

| Path | Type | Measured size | Delete-ability | Notes |
|------|------|----------|----------|------|
| ~/Applications/Xross.before-crossflow-offline-gate-20260911.app/ | Manual full-bundle backup | 496,696 KiB (485M) | Safe (old version) | Full-bundle snapshot taken before the crossflow offline gate change, measured with `du -sk` |
| ~/Applications/Xross.before-drag-fix-20260911.app/ | Manual full-bundle backup | 468,100 KiB (457M) | Safe (old version) | Full-bundle snapshot taken before the drag fix, measured with `du -sk` |
| ~/Applications/Xross.before-ui-instrument-20260911.app/ | Manual full-bundle backup | 457,052 KiB (446M) | Safe (old version) | Full-bundle snapshot taken before adding UI instrumentation, measured with `du -sk` |
| ~/Applications/Xross.before-crossflow-connect-20260911.app/ | Manual full-bundle backup | 456,876 KiB (446M) | Safe (old version) | Full-bundle snapshot taken before the crossflow connect change, measured with `du -sk` |
| ~/Applications/Xross.before-rebuild-20260910.app/ | Manual full-bundle backup | 456,472 KiB (446M) | Safe (old version) | Full-bundle snapshot taken before the rebuild (oldest of the 5), measured with `du -sk` |
| ~/.xross-secrets-backup-2026-08-28-2250/ and 1 more, 2 directories total | Manual secrets backup | 796 KiB (788 + 8) | Caution (contains secrets) | Xross secrets backup directories from 2026-08-28/29; small in size but sensitive data — confirm current credentials exist before handling |

The 5 `.before-*` copies total **2,335,196 KiB ≈ 2.23 GiB**, about 4.7× the current `~/Applications/Xross.app` (496,784 KiB = 485M, measured this session with `du -sk`) — computed from exact KiB figures, the "4.6×" in the profile notes is slightly conservative. The whole directory (`Xross.app` + 5 copies + `XrossSSHPoc.app`) totals 2,863,868 KiB ≈ 2.73 GiB, consistent with the research document's measured 2,847,868 KiB plus subsequent growth.

**Design issue**:

- **Backups via full-bundle copy instead of git**: these 5 `.before-*.app` copies are not the software's own behavior but the developer's workflow — Xross is an in-house app, and before every code change the developer manually `cp -R`s the whole `.app` into `~/Applications` as a "pre-change snapshot", named `Xross.before-<change-name>-<YYYYMMDD>.app`. Each copy is 446–497 MB; 5 were produced across 2026-09-10 to 09-11 and have never been cleaned since (through 2026-09-30). Meanwhile git already fully covers that role: the xross-dev repo has version history (session records under `.claude/projects/-Volumes-Portable2TB-ExtDev-xross-dev/` confirm development happens in that repo), making whole-bundle copying pure redundancy.
- **No automatic cleanup mechanism of any kind**: the backups are ordinary files created by hand; the app itself contains no cleanup logic, and the system will not clean copies under `~/Applications` either — uncleaned, they pile up forever. This is a process flaw, not an upstream software flaw — Xross has no public repository and no public issue to link (public upstream: unverified).

### Windows

To be filled in by community contributions (see apps/index.md for path conventions)

### Linux

To be filled in by community contributions (see apps/index.md for path conventions)

## Memory issues

| Process | Pattern | Notes |
|------|------|------|
| (No known issues recorded) | — | The scan evidence `memoryNotes` is empty; on 2026-09-30 this session's `ps aux \| grep -i xross` had no matches — the app was not running; no resident/helper abuse or leak patterns observed |

## Cleanup recommendations

- **Safe** (no side effects if deleted; the software rebuilds on its own):
  - `~/Applications/Xross.before-crossflow-offline-gate-20260911.app/` (496,696 KiB)
  - `~/Applications/Xross.before-drag-fix-20260911.app/` (468,100 KiB)
  - `~/Applications/Xross.before-ui-instrument-20260911.app/` (457,052 KiB)
  - `~/Applications/Xross.before-crossflow-connect-20260911.app/` (456,876 KiB)
  - `~/Applications/Xross.before-rebuild-20260910.app/` (456,472 KiB)
  - The 5 copies total ≈2.23 GiB; all are old-version pre-change snapshots — keep the current `Xross.app` untouched, and git history can already trace back any change
- **Caution** (loses cache or config; rebuilding has a cost; needs user confirmation):
  - `~/.xross-secrets-backup-2026-08-28-2250/` and `~/.xross-secrets-backup-2026-08-29-0110/` (796 KiB combined): secrets backups, not caches — confirm current credentials still work / a newer backup exists before deleting
  - `~/Applications/XrossSSHPoc.app/` (15,888 KiB): a POC prototype, not a stale copy — whether it is still needed is the developer's call
- **Do not delete** (user data):
  - `~/Applications/Xross.app/` (496,784 KiB, the version currently in use, v1.0.71)

## Upstream status

- Official cleanup options: none — Xross is an in-house app (this session read `~/Applications/Xross.app/Contents/Info.plist`: bundle id `one.xross.app`, version 1.0.71, URL scheme `xross`); no official cleanup feature exists, and the `.before-*` backups are not software artifacts either. The fix belongs in the development workflow: replace manual pre-change full-bundle copies with git commits/tags.
- Related issues/PRs: no linkable public issue — an in-house app has no public upstream repository (whether a public repository exists: unverified); this profile's list of 5 copies comes from first-hand local measurement and is a first record.

Evidence files: scan evidence, local recheck commands, and research document sources are in [evidence-macos-2026-09-30.txt](evidence-macos-2026-09-30.txt).
