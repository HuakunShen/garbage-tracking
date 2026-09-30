---
title: Homebrew
description: Old-version kegs have piled up 4.57 GiB in the Cellar, plus llvm@20 (1.5G) superseded by llvm@21 and 2.2G of local tap git clones; a single `brew cleanup` reclaims about 3.3GB, and up to about 7–8.2 GB can be recovered in total
category: devtool
os: [macos]
last-verified: 2026-09-30
---

# Homebrew

The de facto standard package manager on macOS, installing everything into `$(brew --prefix)` (on Apple Silicon that is `/opt/homebrew`, which is exactly what this machine uses). The entire resource problem picture is on the disk side: within Cellar 19G there are leftovers from 80 formulae and 120 non-latest old-version kegs, measured in total at 4,794,468 KiB ≈ 4.57 GiB; in addition, the versioned formula llvm@20 (1.5G) is never cleaned up after being superseded by llvm@21, and the homebrew-core/cask full git clones (2.2G) are no longer needed in API mode. There are no memory-side issues: brew has no resident process. Conclusion: a single `brew cleanup` (dry-run measured estimate 3.3GB) completes most of the cleanup; running `brew upgrade` first and then cleaning recovers all old kegs, with a combined ceiling of about 8.2 GB. Severity: high.

## Disk issues

### macOS

Measurement method: `du -sh` / `du -sk` directory-by-directory scan (2026-09-30), byte-for-byte consistent with the scan evidence.

| Path | Type | Measured size | Delete-ability | Notes |
|------|------|----------|----------|------|
| /opt/homebrew/Cellar/ | Old-version keg accumulation | 19G (of which non-latest old versions 4.57 GiB) | Safe (`brew cleanup`) | 80 formulae with multiple coexisting versions and 120 non-empty old kegs: gcc×3 (906M), boost×3 (766M), proj×2 (814M), qtdeclarative×3 (297M), go×2 (264M), openvino×3 (248M), python@3.14×3 (183M), qtbase×3 (145M), openssl@3×4 (121M), etc. Note: about 3.3GB of this can be deleted in one step by `brew cleanup` (official dry-run estimate); the remaining ~1.3GiB is kept by cleanup because the owning formula is not the latest version — run `brew upgrade` first, then clean (mechanism below) |
| /opt/homebrew/Cellar/llvm@20/20.1.8 | Superseded versioned formula | 1.5G (1,510,340 KiB) | Caution | llvm@21 21.1.8 is already installed side by side; `llvm@20`/`llvm@21` are two different formulae and brew never "upgrades" across formula names, so the old-named formula is never uninstalled automatically. Measured `brew uses --installed llvm@20` shows it is still declared as a dependency by the installed lld@20; uninstalling requires `brew uninstall llvm@20 lld@20` to handle it together |
| /opt/homebrew/Library/Taps/homebrew/homebrew-core | Local git tap clone | 1.5G | Safe (in API mode) | This machine is in API mode (`~/Library/Caches/Homebrew/api/` contains fresh formula_names.txt etc. dated 2026-09-29); day-to-day install/upgrade only reads API metadata; this full clone serves only dev scenarios like `brew edit`/sending PRs, and brew re-clones on demand after deletion |
| /opt/homebrew/Library/Taps/homebrew/homebrew-cask | Local git tap clone | 686M | Safe (same as above) | Same as homebrew-core; Taps total 2.2G (plus the third-party lihaoyun6 tap at 5M) |
| ~/Library/Caches/Homebrew | Download/metadata cache | 66M (measured 53M in the 2026-09-27 experiment record; fluctuates as API files refresh) | Safe (`brew cleanup --prune=all`) | Contains bottle download cache and API metadata JSON; small in scale, not a priority |

(`/opt/homebrew/Caskroom` 1.2G was measured cask by cask and has 0 old versions; these are normal, active installations and are not counted as an issue.)

**Design issue**: three overlapping mechanisms.

1. **The Cellar keeps every installed version per formula, and cleanup is not a daemon**. brew has no background service; automatic cleanup only piggybacks on `brew install/upgrade/reinstall`: a full cleanup runs only every 30 days (`HOMEBREW_CLEANUP_PERIODIC_FULL_DAYS`, default 30, see this machine's `/opt/homebrew/Library/Homebrew/env_config.rb:265-269`). No `HOMEBREW_*` environment variables are set in this machine's shell (measured `env | grep HOMEBREW` is empty), i.e. default configuration, yet old kegs still piled up 4.57 GiB — the problem is in the next item.
2. **cleanup skips the entire rack of a formula whose "most recent version is not installed"**. Source on this machine `/opt/homebrew/Library/Homebrew/formula.rb:3760-3803` (`eligible_kegs_for_cleanup`): old kegs are only picked for deletion when `latest_version_installed?` is true; if upstream has released a new version but this machine has not upgraded, the whole rack (old + active versions) is skipped outright, printing "Skipping <formula>: most recent version <x> not installed". This dry run measured **117 such** Skipping lines — proj 9.7.1, go 1.26.1, openssl@3 3.6.1–3.6.3, old openvino versions, etc. are kept wholesale precisely because their owning formula lags upstream. In other words: **the lazier you are about `brew upgrade`, the more old kegs can never be cleaned**. Whether upstream offers a better option: the master switch for automatic cleanup `HOMEBREW_NO_INSTALL_CLEANUP` and the exemption list `HOMEBREW_NO_CLEANUP_FORMULAE` only let you turn it "smaller", not "more frequent"; targeted upstream issue chains are to be filled in by community contributions (unverified).
3. **Versioned formulae (llvm@20 / llvm@21, lld@20 / lld@21) are never automatically cleaned**. They are different formula names, unreachable by both the auto-upgrade and cleanup mechanisms; only a manual `brew uninstall` removes them. The fact that llvm@20 still occupies 1.5G on this machine after llvm@21 is in place is exactly this mechanism.
4. **In API mode, full tap clones are still maintained as before**. From Homebrew 4.x onward, package information for homebrew-core/cask goes through the API by default (`HOMEBREW_NO_INSTALL_FROM_API` disables this, see this machine's env_config.rb:612), but once the local git clones exist they keep updating via `git fetch`; ordinary users have no use for them, yet each takes 0.7–1.5G.

### Windows

To be filled in by community contributions (path conventions in apps/index.md). Homebrew officially does not support Windows (a WSL route exists with Linux-style paths; no evidence found).

### Linux

To be filled in by community contributions (path conventions in apps/index.md). Linuxbrew's path convention is `$(brew --prefix)` (usually `~/.linuxbrew` or `/home/linuxbrew/.linuxbrew`); no evidence on this machine.

## Memory issues

No known issues recorded.

brew is a pure command-line tool with no resident daemon; the scan evidence's memoryNotes is empty, and `ps aux | grep brew` on this machine only caught the ephemeral curl analytics-reporting process — no leak surface.

## Cleanup recommendations

- **Safe** (no side effects from deletion; the software rebuilds it itself):
  - `brew cleanup` — one step reclaims about 3.3GB (86 old Cellar kegs + 7 old portable-ruby copies, 34.6MB each, ~242MB in total, plus cache files). Run `brew upgrade` first and then `brew cleanup` again to also reclaim the old kegs protected by "Skipping: most recent version not installed" (proj, go, openssl@3, openvino, etc., about 1.3GiB);
  - Delete `/opt/homebrew/Library/Taps/homebrew/homebrew-core` and `homebrew-cask` (safe to delete in API mode; re-cloned automatically on demand); for day-to-day cache cleanup use `brew cleanup --prune=all` (cleans cache files older than `HOMEBREW_CLEANUP_MAX_AGE_DAYS`, default 120 days; this machine's ~/Library/Caches/Homebrew is only 66M, so the gain is small).
- **Caution** (caches or config are lost, rebuilding has a cost, needs user confirmation):
  - `brew uninstall llvm@20 lld@20` — 1.5G+; only delete after confirming you no longer need the llvm 20 series (llvm@21 is installed) and that no scripts/CI hardcode `llvm@20` paths;
  - The third-party tap (/opt/homebrew/Library/Taps/lihaoyun6, 5M), if no longer used: `brew untap lihaoyun6/homebrew-tap`;
  - If you want long-term peace and quiet, set `HOMEBREW_NO_CLEANUP_FORMULAE` to protect a few formulae instead of turning off all automatic cleanup.
- **Do not delete** (user data):
  - The active kegs `/opt/homebrew/Cellar/<formula>/<latest version>` (the bulk of the 19G) and their corresponding `/opt/homebrew/opt/*` and `/opt/homebrew/bin` links — this is the installed software itself;
  - `/opt/homebrew/Caskroom` (1.2G, measured 0 old versions, all active GUI apps);
  - `/opt/homebrew/var`, `/opt/homebrew/etc` (databases, service configuration, and other runtime user data);
  - `~/Library/Caches/Homebrew/api` (it would be rebuilt automatically, but there is no benefit; 66M is not worth touching).

## Upstream status

- Official cleanup options: `brew cleanup` (manual; old kegs + stale cache); `brew cleanup --prune=<days>`/`--prune=all` (clean cache by age); `brew cleanup -n` (dry run, with a "Would free approximately X" estimate); automatic cleanup piggybacks on install/upgrade/reinstall, full-cycle `HOMEBREW_CLEANUP_PERIODIC_FULL_DAYS` (default 30 days), cache retention `HOMEBREW_CLEANUP_MAX_AGE_DAYS` (default 120 days), master switch `HOMEBREW_NO_INSTALL_CLEANUP`, exemption list `HOMEBREW_NO_CLEANUP_FORMULAE` (all of the above defaults and semantics were verified on this machine at `/opt/homebrew/Library/Homebrew/env_config.rb:261-269, 605-611`); the official docs at docs.brew.sh/Manpage have matching entries. There is no official "auto-upgrade all formulae" option (the community third-party `brew autoupdate` exists).
- Related issues/PRs: the behavior where old kegs are skipped rack-by-rack because "the formula is not the latest version" is at source location formula.rb:3760-3803 on this machine (`eligible_kegs_for_cleanup`); a tracking issue for this behavior in the official repo is unverified (this dossier makes no uncited references).
