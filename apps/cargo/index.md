---
title: Cargo
description: ~/.cargo/registry cache at 2.6 GB grows only (unpacked sources 2.0G + .crate download packages 446M + sparse index 181M); the stable channel has no auto-cleanup — the whole thing is deletable and the next build re-downloads automatically
category: devtool
os: [macos]
last-verified: 2026-09-30
---

# Cargo

Rust's official package manager and build tool, with all state concentrated in `~/.cargo/`: the registry cache (`~/.cargo/registry`, 2.6G) and binaries installed via `cargo install` (`~/.cargo/bin`, 303M). Resource profile: the classic "grows only, never shrinks" package-manager cache — every crate ever used keeps both a compressed archive and an unpacked source copy in the registry (measured here: 3,021 .crate files and 1,834 unpacked version directories, accumulating with nothing reclaiming them), while the entire registry can be deleted at any time and re-downloaded on demand; bin contains in-use tools and should be kept. No memory issues on record: no resident processes; cargo/rustc are short-lived build processes.

## Disk issues

### macOS

| Path | Type | Measured size | Delete-ability | Notes |
|------|------|----------|----------|------|
| ~/.cargo/registry/ | Cache accumulation | 2.6 GB | Safe (regenerable) | Unpacked sources src 2.0G (1,834 version directories) + download cache cache 446M (3,021 .crate archives) + sparse index index 181M; all re-downloadable on demand, and the first build after deletion re-downloads what the current project needs |
| ~/.cargo/bin/ | In-use tools (not an issue item) | 303 MB | Do not delete | Tools installed via cargo install + rustup shims: rust-analyzer, cargo-audit, cargo-binstall, cargo-ndk, cargo-nextest, cargo-zigbuild, cross, etc.; deletion means reinstalling them one by one |

The rest of `~/.cargo` (from two scans and `du -sh`): `~/.cargo/git` 12M (git dependency clones), `~/.cargo/advisory-db` 42M (cargo-audit's RustSec advisory DB clone, re-fetchable).

**Design issue**: the mechanism is "double storage per crate + grows only". (1) Every build downloads the .crate archive into `registry/cache/` (446M) and unpacks it into `registry/src/` (2.0G) — the same data written to disk twice, with the unpacked copy about 4.5x the compressed size; each version of a same-named crate gets its own src directory, and old versions only accumulate over time. (2) Stable Cargo has no automatic cleanup whatsoever: `cargo clean` only cleans a single project's `target/` and never touches the global cache; the official gc mechanism has been available in nightly since 2023-12 (`[unstable] gc = true` / `-Zgc`, default policy keeps rebuildable data for 1 month and re-downloadable data for 3 months; official blog under "Upstream status"). Local evidence: stable cargo 1.98.0 already ships the GC tracking database `~/.cargo/.global-cache` (1.0 MB SQLite, still being written on 2026-09-30; the registry_crate table has 3,021 rows and registry_src has 1,834 rows, matching the on-disk .crate file count and src directory count one to one) — yet the cache still grew to 2.6G, indicating that on stable it only records "last used" times and never deletes; whether gc is enabled by default on stable is unverified (search was rate-limited on the verification day). (3) Index: this machine already uses the sparse protocol (directory name `index.crates.io-1949cf8c6b5b557f`, default since Rust 1.70); at 181M it is far smaller than the GB-scale the old git index could reach, but the index cache files of every already-resolved crate also grow without shrinking.

### Windows

To be filled in by community contributions (path conventions in apps/index.md)

### Linux

To be filled in by community contributions (path conventions in apps/index.md)

## Memory issues

No known issues recorded (memoryNotes empty in both scans; a spot check of `ps aux` on this machine found no resident cargo/rustc processes. cargo/rustc are short-lived build processes; build-time memory peaks were not measured)

## Cleanup recommendations

- **Safe** (no side effects, software rebuilds on its own): `rm -rf ~/.cargo/registry` — reclaims 2.6 GB wholesale; src/cache/index all re-download on demand, the only cost being a slower first build after deletion; `~/.cargo/advisory-db/` (42M, cargo-audit re-fetches it automatically at runtime).
- **Caution** (rebuilding the cache has a cost, user confirmation required): `~/.cargo/git/` (12M, git dependency clones; the next build must re-clone when a project uses git dependencies). Selectively pruning old version directories under src/ one by one is not recommended — you would have to match versions against each project's Cargo.lock; the payoff is low compared with deleting wholesale and re-downloading.
- **Do not delete** (user data / in-use tools): `~/.cargo/bin/` (303M, installed tools; deletion requires reinstalling one by one via cargo install); `~/.cargo/credentials.toml` (crates.io publishing credentials); `~/.cargo/.crates.toml` and `.crates2.json` (installed-tool manifest); `~/.rustup/` (Rust toolchains, belongs to the rustup profile, handled separately).

## Upstream status

- Official cleanup options: stable has no automatic cleanup and no retention-cap setting; `cargo clean` only affects a project's `target/`. Nightly has offered cache gc since 2023-12: configure `[unstable] gc = true` or use `cargo clean gc` to manually clean by age/size (official blog [Cargo cache cleaning](https://blog.rust-lang.org/2023/12/11/cargo-cache-cleaning/), 2023-12-11); this machine's 1.98.0 stable already ships the tracking database `~/.cargo/.global-cache` but no actual cleanup has been observed. The community tool cargo-cache (`cargo install cargo-cache`, then `cargo cache -a` autoclean) can clean the registry source cache.
- Related issues/PRs: [rust-lang/cargo#7150](https://github.com/rust-lang/cargo/issues/7150) (Cache usage meta tracking issue, open since 2019-07, collecting Cargo disk-usage related topics); the latest status of gc enablement in the stable channel is unverified (search was rate-limited on the verification day; cargo 1.98 docs not checked).
