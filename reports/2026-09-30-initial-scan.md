---
title: 2026-09-30 Initial Full-Disk Scan Report
description: First read-only full-disk scan of the local macOS machine: 4 areas measured, 20 App dossiers created, headline direct-sum reclaimable space ≈244 GB (114 disk issues, 11 memory issues), zero failed areas
---

# 2026-09-30 Initial Full-Disk Scan Report

The first full-disk scan archive of this repo (`garbage-tracking`). On the scan day, **20 App dossiers** were created in total (`apps/<slug>/index.md`, all `last-verified: 2026-09-30`); this report summarizes that scan's scope, methodology, overall findings, and outstanding issues, serving as the baseline for later re-scans. All numbers in this report come from the dossier-creation data returned by the scan workflow (creation highlights + creation results); while writing the report, each `apps/*/index.md` frontmatter was verified one by one (20/20 entries with `os: [macos]`, `last-verified: 2026-09-30`, and titles matching the dossier list).

## 1. Scan scope and methodology

- **Date**: 2026-09-30, completed in a single day; the fast-growing item (`~/.codex`) additionally references the 09-27 audit value (37.65 GiB) as a comparison baseline.
- **Machine**: a local macOS (Apple Silicon) machine, the only measured environment — **all magnitudes represent this machine only and are not extrapolated across platforms**.
- **Four areas**:
  1. **Home directory `~`**: development toolchains and AI tool state (`~/.codex`, `~/.cache`, `~/.bun`, `~/.cargo`, `~/.local`, `~/Library/pnpm`, `~/.nvm`, `~/.claude`, `~/.zcode`, etc.);
  2. **`~/Library`**: application data, caches, and logs (`Caches/*`, `Application Support/*`, `Logs/*`, store directories on the `Preferences` side);
  3. **Application installs**: inside `.app` bundles under `/Applications` and `~/Applications` (embedded toolchains, dual-version frameworks in one bundle, leftover update packages);
  4. **Memory**: process-level observation (process counts and RSS under the `ps` methodology, including a 90-second short-window observation and historical high-water marks).
- **Tools**: `spacelens` (read-only scanning, preferred), `dust`, `du` (`du -sk` / `du -sh` measured per directory, cited explicitly in several dossier highlights), `ps`.
- **Read-only throughout**: no deletion, modification, or cleanup was performed; all "reclaimable" figures are qualitative estimates, and actual deletion is performed by the user after per-dossier confirmation (repo principle, see [README](../README.md) and [CONTRIBUTING](../CONTRIBUTING.md)).

## 2. Overall findings

Across the 20 dossiers: headline direct-sum reclaimable space ≈ **244 GB**; **114** disk issues and **11** memory issues; severity distribution high 10 / medium 10.

### 2.1 Apps with the largest reclaimable space (top five, ≈205 GB combined, 84% of the total)

1. **ChatGPT / Codex ≈113 GB** — the machine's No. 1 garbage source: `~/.codex` grew from 37.65 GiB to 156.66 GiB in three days (`du -sk` measured 164,268,904 KiB, a net gain of ≈119 GB/3 days); within it, the cargo `target/debug` intermediates in agent worktrees account for **106 GB that is regenerable**; plus 5,264 session jsonl files accumulating without limit (a single file has reached 2.75 GB and is still growing), 14 historical CLI releases totaling 4.1 G, and a 2.6 G log database with no rotation.
2. **uv 36 GB** — `~/.cache` totals 39.9 GiB, of which the uv cache alone holds 36 GB; the unpacked-wheel `archive-v0` alone is 34 GB (**1,446,226 files**), unbounded by default and never pruned.
3. **npm ≈32 GB** — the `_cacache` content-addressed cache holds 21 G that only ever grows; `_npx` has accumulated 168 one-off install directories (the same package in multiple versions, each fully copied, e.g. @deepseek-ai/dsh with two alpha versions at 596M + 559M coexisting).
4. **rustup 13.3 GB** — 9 toolchains total 17 G (`du -sh` measured per toolchain); only stable is used by default, and the remaining 7 — superseded old versions plus an expired nightly — total ≈13.3 G reclaimable via `rustup toolchain uninstall`.
5. **pnpm ≈10.4 GB** — the home directory holds three legacy store formats (v3/v10/v11) coexisting at 26.5 G combined; `pnpm store path` measured as already pointing to an external drive, so all three home-directory stores are legacy data; the active store (v11 17G + v10 1.1G) has another 18.1 G reclaimable as cache rebuild (not counted in the headline figure).

### 2.2 The most typical design-issue patterns

1. **Caches/sessions/logs unbounded, growing-only** (broadest coverage): uv archive-v0, npm `_cacache`, Yarn 3.4 G, and cargo 2.6 G are all unbounded; session transcripts accumulate without limit (Codex 5,264 jsonl files; Claude Code 1,846 jsonl files totaling 5.1 G); logs have no rotation (codex `logs_2.sqlite` 2.6 G; opencode.log appends to a single file, 9/27 46.9M → 9/30 26M, suspected reset on startup, mechanism unverified). Tools write "caches" to disk as permanent assets, and almost none provides a default retention window.
2. **Version/format pile-up**: rustup 9 toolchains; nvm 7 Node versions; Codex 14 CLI releases; OpenCode Desktop keeping 2.0.6→2.0.18, 9 versions (8 old ones ≈1.33 G); Homebrew 80 formulas with 120 old kegs totaling 4.57 GiB; Chrome carries two complete version frameworks inside a single `.app` (the old one 712M); pnpm has three store formats coexisting; extension directories hold old/new version pairs (in vscode, claude-code 2.1.282+2.1.283 coexist at 448M). **Self-updating software that only ever grows is a systemic problem**.
3. **One copy of software fully duplicated in many places**: the same AI extension is fully installed once per VS Code-family editor (claude-code 6 copies totaling 1.2 G, chatgpt/codex 4 copies totaling 1.58 G, kilo-code 4 copies totaling 894M); universal bundles also carry 5 unused platforms (a single codex.exe 81M).
4. **Redundant backups and duplicated update packages**: Xross has 5 `.before-*` full manual backups at 2.23G (≈4.7x the current version); `.claude.bk` is 1.5G with the copy on the same disk as the original; antigravity has a 395M old backup; agy has duplicates of ~350M; updaters store the same zip twice (OpenCode Desktop 215M×2, ZCode 233M×2).
5. **AI agents build their own build environments and never reclaim them**: the Codex agent creates a git worktree per task and builds in place (cargo target 106G), leaving everything behind when the task ends; bun even leaves the WebKit arm64-debug-asan debug build (1.3G) in the cache.
6. **Desktop process-level leaks**: see 2.3.

### 2.3 Key memory-side findings

- Of the 20 dossiers, **5 carry memory issues** (11 items total): chatgpt-codex (3), zcode (3), vscode (2), arc (2), google-chrome (1). Cache-type devtools (uv/npm/pnpm/rustup etc.) all have 0 items — **disk hogs are not necessarily memory hogs**; memory issues concentrate in Electron desktop shells and AI agents.
- **The only true process-level leak: Codex embedded in the ChatGPT desktop app** — it spawns MCP servers per thread as sets and never reclaims them: a 90-second observation already shows 14 child processes / 0.76 GB; the historical high-water mark is 137 processes / 3.69 GB (all at 0% CPU); a single app-server process has RSS 1.26 GB; only restarting the app clears them.
- **Largest resident: ZCode at 4.5–5 GB RSS** — the host runs 6 concurrent zcode-cli processes (session layer 2.6–2.9 G), each session carrying its own MCP servers and dedicated helpers with no shared reuse; the Renderer holds steady at ~871M. ⚠️ Attribution trap: external monitoring once mis-attributed qemu (8.76G) to the ZCode row; the app itself is actually ≈4 G (the 09-28 research did the full breakdown).
- **Additive counts (not leaks)**: VS Code 22 processes / 3.68 GB (each window keeps a resident codex app-server×2 and pylance, 237–284M each); Arc 21 processes / 3.68 GB (12 Renderers accumulating one by one to 2.58 G, longest-lived 1h21m, main process 612M) — a consequence of Chromium's one-process-per-tab design, "reasonable but can be turned off".

## 3. Dossier list

Full dossiers in `apps/<slug>/index.md`. The reclaimable column is the **headline figure** returned at dossier creation (each entry's methodology differs: some are zero-loss Safe-tier only, some include the Cautious tier, broken out in parentheses; summing across entries is only a magnitude reference).

| slug | App | Reclaimable estimate | severity | Disk issues | Memory issues |
|------|-----|-----------|----------|---------|---------|
| chatgpt-codex | ChatGPT / Codex | ≈113 GB | high | 11 | 3 |
| uv | uv (~/.cache) | 36 GB | high | 6 | 0 |
| npm | npm | ≈32 GB | high | 5 | 0 |
| rustup | rustup | 13.3 GB | high | 9 | 0 |
| pnpm | pnpm | ≈10.4 GB (zero loss in home: v3 8.4G + ~/.pnpm-store-local 868M + Caches 1.2G; including the old-format external volume adds 3.2G for ≈13.7 GB total); another 18.1 GB active store (v11 17G + v10 1.1G) is reclaimable as cache rebuild, at the cost of re-downloading for the related projects | high | 6 | 0 |
| homebrew | Homebrew | ≈7 GB (brew cleanup 3.3GB + llvm@20 1.5G + taps 2.2G; brew upgrade first, then cleanup, reaches the upper bound of ≈8.2 GB) | high | 5 | 0 |
| bun | bun | 6.2 GB | high | 3 | 0 |
| zcode | ZCode | ≈4.8 GB (Safe tier ≈2.2 GB: embedded browser cache 1.16G + duplicated update packages 466M + two daily-rotated log sets 455M + computer-use dev copy 124M; Cautious tier ≈2.6 GB: checkpoints 928M + artifacts 595M + monolithic sqlite 1.1G) | high | 7 | 3 |
| yarn-berry | Yarn (Berry) | 3.4 GB | medium | 2 | 0 |
| google-chrome | Google Chrome | ≈ 2.7 GB | medium | 6 | 1 |
| cargo | Cargo | 2.6 GB | medium | 2 | 0 |
| xross | Xross | ≈2.23 GiB | medium | 6 | 0 |
| arc | Arc | 1.8 GB | medium | 3 | 2 |
| vscode-family-extensions | VS Code-family editor extensions ×5 | ~1.7 GB (most conservative hard figure ≈766 MiB) | high | 13 | 0 |
| claude-code | Claude Code | 1.6 GB zero loss (~/.claude/.claude.bk 1.5 GB + duplicated config backup ~2 MB); up to ≈6.6 GB including old session history | high | 4 | 0 |
| opencode-desktop | OpenCode Desktop | 1.55 GB | medium | 2 | 0 |
| nvm | nvm | ~1.5 GB | medium | 7 | 0 |
| vscode | VS Code | ≈1.2 GB lossless (CachedExtensionVSIXs 776M + CachedData 398M + Crashpad/logs 55M); the Cautious tier adds ≈3.2 GB | medium | 7 | 2 |
| local-tools | ~/.local tool pile | ~565 MB (Safe tier: cursor-agent old versions 263M + agy.old 172M + ai-lens scan-cache 104M + opencode.log 26M; Cautious tier not counted) | medium | 6 | 0 |
| gemini-antigravity | Gemini / Antigravity | 0.4 GB immediately reclaimable (the whole antigravity-backup); up to ≈2 GB total once the browser-profile is confirmed abandoned | medium | 4 | 0 |
| **Total (20 entries)** | | **≈244 GB** | high 10 / medium 10 | **114** | **11** |

Additional methodology notes:

- **Amounts not counted in the table's total**: pnpm active store 18.1 GB, Chrome Service Worker 1.3G, and the Cautious-tier increments in each entry's parentheses (e.g. vscode +3.2 GB, claude-code old sessions +5 GB, gemini-antigravity browser-profile ~1.6 GB). Executing everything per each dossier's "Safe / Cautious / Do not delete" tiers, the total ceiling is significantly higher than 244 GB.
- **category distribution**: devtool 10, ai-coding 4, editor 2, ide 1, other 3 (20 total).
- The most disk issues in a single entry is vscode-family-extensions (13 items, a multiplication effect of five editors × in-directory version pile-up); the two entries with both disk and memory issues at severity=high are chatgpt-codex and zcode.

## 4. Outstanding issues

- **Failed areas: none**. All four scan areas (home directory / ~/Library / application installs / memory) completed with no interruptions or missing data.
- **Failed validations: none**. The list of leftover validation issues returned by the dossier-creation workflow was an **empty list**; no failed validations were recorded this time (what was validated is whatever the creation workflow actually checked; this report transcribes it as-is).
- **Windows / Linux blanks**: all 20 dossiers' frontmatter `os` is only `[macos]` (verified one by one with grep while writing this report), and each dossier's `### Windows` / `### Linux` sections remain in the to-be-supplemented-by-the-community state. All magnitudes in this report must **not** be extrapolated to other operating systems.
- **In-entry items pending confirmation** (already written into the dossiers, left for later scans or upstream verification):
  - gemini-antigravity: whether `antigravity-browser-profile` (1.6G) is still in use by the IDE is unconfirmed — not counted as reclaimable until abandonment is confirmed;
  - rustup: before deleting the pinned 1.84.1 / 1.85.0 (2025-02), check each project's `rust-toolchain.toml`; if the nightly is in use, the reclaimable amount drops to 10.4G;
  - nvm: v20 / v22.23.2 / v24 belong to different major version lines; deletion depends on whether old projects still use them;
  - chatgpt-codex: whether upstream offers a retention policy/cleanup configuration is unverified; upstream issues were not searched and the dossier cites no unverified issue numbers;
  - google-chrome: the 1.3G Service Worker is deletable but makes sites' first loads slower; not counted in the headline figure;
  - pnpm: the active store is reclaimable only if re-downloading for the related projects is acceptable.

## 5. Recommended next steps

1. **Run the cleanup sequence on the top five "zero-loss first"** (≈205 GB, 84% of the total): pnpm home-directory legacy stores → `uv cache prune` / empty the whole cache → `npm cache clean --force` + clear `_npx` → cargo cache cleanup → `rustup toolchain uninstall` → `brew cleanup` (upgrade first, then cleanup, reaches ≈8.2 GB); Codex's 106 GB target is regenerable build output, but the worktrees themselves must be verified before deletion (the dossier marks it "Cautious"). Execution method: with [skills/garbage-tracker](../skills/garbage-tracker/SKILL.md), list full paths and measured sizes item by item, request confirmation tier by tier — the repo principle is **describe, don't delete**.
2. **Define the reports/ archive specification and build growth curves** (already on the README roadmap): `~/.codex` growing ≈119 GB net in three days means fast-growing items need a **weekly**, not semi-annual, re-check cadence; the next scan should re-check the three fastest-changing directories — codex / uv / npm — first and compare against this report's baseline.
3. **Fix monitoring attribution**: external memory monitoring mis-attributed qemu (8.76G) to the ZCode row; correct it per the 09-28 breakdown before including it in cross-time comparisons, otherwise the memory curve is systematically distorted.
4. **Windows / Linux empirical expansion** (README roadmap): all 20 dossiers are macos-only; filling in the two other platforms is the database's largest coverage gap.
5. **Schema validation CI** (README roadmap): this scan's empty validation-leftovers list can serve as the baseline; once CI is in place, make "failed validations" a mandatory section of every report.
6. **Upstream feedback loop**: most dossiers' "Upstream status" currently reads "unverified"; next step is to search upstream repos for issues — especially the two patterns of Codex sessions/logs having no retention policy and MCP servers spawned per thread never being reclaimed — and backfill the dossiers once verified.
