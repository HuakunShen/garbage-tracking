---
title: rustup
description: 9 Rust toolchains have piled up 17 GB, of which about 13.3 GB is old versions superseded by stable plus an expired nightly — recoverable with rustup toolchain uninstall
category: devtool
os: [macos]
last-verified: 2026-09-30
---

# rustup

Rust's official multi-version toolchain manager: every channel/version installed gets a complete standalone copy of the compiler unpacked under `~/.rustup/toolchains/` (455 MB–3.4 GB each). This machine has 9 toolchains coexisting totaling 17 GB (measured per-toolchain with `du -sh`): the only toolchain referenced by `settings.toml` as default is stable (3.4 GB, in use, not counted); the other 7 old versions superseded by stable plus 1 expired dated nightly from 2026-05-06 total about 13.3 GB recoverable via `rustup toolchain uninstall` (10.4 GB if the nightly is still in use) — a textbook case of version accumulation. rustup's own `downloads/` and `tmp/` both measured 0B; the bloat comes entirely from "install but never clean" toolchains; no records on the memory side.

## Disk issues

### macOS

| Path | Type | Measured size | Delete-ability | Notes |
|------|------|----------|----------|------|
| ~/.rustup/toolchains/stable-aarch64-apple-darwin/ | In-use default toolchain | 3.4 GB | Do not delete | `settings.toml`'s `default_toolchain`; `rustup show` shows active + default (directory mtime 2026-09-02, still being updated) |
| ~/.rustup/toolchains/1.97.1-aarch64-apple-darwin/ | Version accumulation | 3.0 GB | Safe (old version) | Superseded by stable; the largest recoverable old version |
| ~/.rustup/toolchains/nightly-2026-05-06-aarch64-apple-darwin/ | Version accumulation (dated nightly) | 2.9 GB | Caution | Dated nightly that has not updated in nearly 5 months (directory mtime 2026-05-19); keep if any project still depends on the nightly of that date |
| ~/.rustup/toolchains/1.98.1-aarch64-apple-darwin/ | Version accumulation | 1.8 GB | Safe (old version) | Superseded by stable |
| ~/.rustup/toolchains/1.84.1-aarch64-apple-darwin/ | Pinned-version leftover | 1.6 GB | Caution | One of the two oldest pinned versions on the machine (directory mtime 2026-01-15); may be referenced by a project's `rust-toolchain.toml`, verify before deleting (a scan record calls it a 2025-02 pin, which disagrees with the measured mtime — unverified) |
| ~/.rustup/toolchains/1.93.0-aarch64-apple-darwin/ | Version accumulation | 1.3 GB | Safe (old version) | Superseded by stable |
| ~/.rustup/toolchains/1.94.1-aarch64-apple-darwin/ | Version accumulation | 1.2 GB | Safe (old version) | Superseded by stable |
| ~/.rustup/toolchains/1.85.0-aarch64-apple-darwin/ | Pinned-version leftover | 1.1 GB | Caution | Old pin from the same batch as 1.84.1 (directory mtime 2026-02-25); check each project's `rust-toolchain.toml` before deleting |
| ~/.rustup/toolchains/1.98.0-aarch64-apple-darwin/ | Version accumulation | 455 MB | Safe (old version) | Noticeably smaller than its contemporary 1.98.1 (1.8 GB), likely a minimal-profile install or leftover — unverified |

**Design issue**: the mechanism is "one full copy per version + install but never clean". (1) rustup unpacks every channel/version into a separate full directory under `~/.rustup/toolchains/<name>-<triple>/` (rustc + cargo + components, 1–3.4 GB); `rustup update` only updates already-installed channels and never deletes old versions. (2) The pinning mechanism silently grows the disk: once a project root's `rust-toolchain.toml` pins a specific version number, any build makes rustup automatically download and install that version (no confirmation), and once the project moves on, that toolchain stays on disk with nobody reclaiming it — the `[overrides]` section in this machine's `settings.toml` measured empty, which shows the 7 old versions are not caused by rustup directory overrides and almost all come from per-project `rust-toolchain.toml` pins (which project pinned which version was not scanned — unverified). (3) A dated nightly freezes once it stops updating: `nightly-2026-05-06` only rotates with an explicit `rustup update nightly`; left untouched for 5 months it idles away 2.9 GB. Upstream has no automatic cleanup mechanism of any kind (see "Upstream status").

### Windows

To be filled in by community contributions (see apps/index.md for path conventions)

### Linux

To be filled in by community contributions (see apps/index.md for path conventions)

## Memory issues

No known issues recorded (memoryNotes empty in both scans of this machine; rustup has no resident process, it only runs briefly during install/switching)

## Cleanup recommendations

- **Safe** (no side effects if deleted; rustup auto-reinstalls when a project needs it): `rustup toolchain uninstall 1.97.1 1.98.0 1.98.1 1.93.0 1.94.1` — 5 recent old versions superseded by stable, about 7.8 GB total. Even if a project's `rust-toolchain.toml` still references one of them, rustup will re-download it automatically on the next build; the only cost is one re-download.
- **Caution** (confirm before deleting; rebuilding has a cost): (1) `~/.rustup/toolchains/nightly-2026-05-06-aarch64-apple-darwin/` (2.9 GB; confirm no project depends on the nightly of that date before deleting, or rotate to a new one with `rustup update nightly`); (2) `~/.rustup/toolchains/1.84.1-aarch64-apple-darwin/` and `~/.rustup/toolchains/1.85.0-aarch64-apple-darwin/` (2.7 GB combined, the two oldest pins on the machine; before deleting, verify with `grep -r "1.84\|1.85" --include=rust-toolchain.toml` across project roots). Recovering all non-default toolchains totals about 13.3 GB (10.4 GB if the nightly is in use).
- **Do not delete** (in use): `~/.rustup/toolchains/stable-aarch64-apple-darwin/` (3.4 GB, the `settings.toml` default and currently active); the whole `~/.cargo/` (cargo itself, registry cache and installed tools — covered by a separate profile, handled separately from this one).

## Upstream status

- Official cleanup options: **no automatic cleanup, no retention-count setting**. Measured on this machine, `rustup toolchain --help` only has the four subcommands `install` / `uninstall` / `list` / `link` — no prune / gc / autoremove; rustup cleans up its own `~/.rustup/downloads/` and `~/.rustup/tmp/` (both measured 0B), but for toolchains it installs and never cleans. The only official means is manually running `rustup toolchain list` to inspect plus `rustup toolchain uninstall <name>` to remove them one by one.
- Related issues/PRs: unverified (no specific issue links in the local evidence, none invented; whether the rust-lang/rustup repo has an in-progress toolchain GC proposal was not checked).
