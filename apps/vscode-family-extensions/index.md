---
title: VS Code-family editor extensions ×5
description: Five editors' extension directories total 9.4 GB — the same AI extension is fully installed once per editor, old and new versions linger in pairs, and universal packages carry 5 unused platforms; conservatively about 1.7 GB is recoverable
category: editor
os: [macos]
last-verified: 2026-09-30
---

# VS Code-family editor extensions ×5

This covers the extension directories `~/.<product-name>/extensions` of the five VS Code-family fork editors (VS Code, Cursor, Qoder, Trae, Kiro). They total 9.4 GB (measured with du), and the waste is threefold: the same AI extension is installed as a full copy per editor (claude-code ×6 copies totaling 1.2 GB, ChatGPT/Codex ×4 copies totaling 1.58 GB, kilo-code ×4 copies totaling 894 MB, geminicodeassist ×3 copies totaling 779 MB), old and new versions linger in pairs within the same directories (at least 5 pairs measured in .qoder), and universal packages carry 5 platforms this machine never uses (a single `windows-x86_64/codex.exe` alone is 81 MB). Conclusion: about 1.7 GB is recoverable under the safe criterion (about 766 MiB under the most conservative hard criterion); on memory, extensions live inside the editor process, so no separate records exist.

## Disk issues

### macOS

| Path | Type | Measured size | Delete-ability | Notes |
|------|------|----------|----------|------|
| ~/.qoder/extensions/ | Duplicate installs + version accumulation | 2.5 GB | Partial (old versions and duplicate extensions) | Largest of the 5 directories; contains at least 5 pairs of old/new versions coexisting (see below) |
| ~/.vscode/extensions/ | Duplicate installs + one oversized extension | 2.3 GB | Partial | The single openai.chatgpt extension is 670M (re-measured with du); claude-code 2.1.282+2.1.283 once coexisted (448M combined), now cleaned down to only 2.1.284 (227M) by updates |
| ~/.cursor/extensions/ | Duplicate installs + universal packages | 2.3 GB | Partial | openai.chatgpt-0.4.71-universal is 387M, of which 353M is non-macos-aarch64 platform files |
| ~/.trae/extensions/ | Duplicate installs + universal packages | 1.7 GB | Partial | openai.chatgpt-0.4.69-universal is 416M, of which 334M is non-native-platform files |
| ~/.kiro/extensions/ | Duplicate installs | 455 MB | Partial | claude-code-2.1.11 alone is 177M |
| linux-*, macos-x86_64, windows-* under ~/.cursor/extensions/openai.chatgpt-0.4.71-universal/bin/ | Multi-platform bundling | 353 MB | Safe (not this machine's platform) | du measured 62+75+63+70+83M; includes an 81,097,192 B windows-x86_64/codex.exe (re-measured with stat); already counted in the row above |
| Non-macos-aarch64 platforms under ~/.trae/extensions/openai.chatgpt-0.4.69-universal/bin/ | Multi-platform bundling | 334 MB | Safe (not this machine's platform) | du measured 59+71+60+66+78M; already counted in the row above |
| Each editor's cloudcode_cli.zip for geminicodeassist under ~/.vscode, ~/.cursor, ~/.qoder | Redundant archives | 535 MiB | Caution | 161,146,335 + 199,894,513 + 200,035,746 B (stat); each archive packs a 5-platform CLI, whose non-darwin_arm64 members measure 1,491,594,064 B uncompressed (zipinfo); the three archives have mutually different hashes so they cannot be deduplicated |
| *.map (≥100KB) within the 5 directories above | Shipped debug files | 376.9 MB | Safe | find+stat measured 175 files (qoder 169.7M/72, cursor 84.4M/28, trae 77.1M/55, vscode 38.9M/13, kiro 6.8M/7); zero runtime dependency |
| Old-version directories within ~/.qoder/extensions/ | Version accumulation | ≈81 MB (5 pairs measured) | Safe (old version) | gitlens 17.9.0+17.10.0 (21M+21M), python 2025.16.0+2026.0.0 (35M+35M), debugpy 2025.14.0+2025.18.0 (21M+38M), golang.go 0.52.1/0.52.1-universal/0.52.2 (2.9M+11M+2.9M), biome 3.3.0+3.4.0 (1.6M+1.4M) |
| ~/.qoder/extensions/anthropic.claude-code-2.1.44-darwin-arm64/resources/native-binary/claude.zst | Redundant archive | 38.9 MB | Safe | ls confirmed it sits side by side with the already-extracted claude (183,437,744 B) in the same directory — pure install leftover |
| ~/.vscode/extensions/ms-python.vscode-pylance-2026.4.1/dist/wasi/python-3.13.11.zip, python-3.14.7.zip | Redundant archives | 28 MB | Safe | stat measured 13,706,729 + 14,291,017 B; sibling extracted directories with the same names already exist |
| ~/.trae/extensions/moonshot-ai.kimi-code-0.3.1-darwin-arm64/bin/kimi/archive.tar.gz | Runtime to-be-extracted archive | 61 MB | Caution | An entire Python.framework, only extracted on first run; if deleted, it will be re-downloaded on first launch |

**Design issue**: three layers of mechanisms stack up. (1) **Cross-editor duplication**: the VS Code extension model installs extensions into per-product directories (`~/.vscode`, `~/.cursor`, `~/.qoder`, `~/.trae`, `~/.kiro`); a marketplace install unpacks the whole VSIX (including native binaries), and the forks share no storage whatsoever — so the same Claude Code lies at 6 locations (5 editors + an old version inside VS Code), each copy a 170–225 MB `claude`, all with different hashes (versions 2.1.11→2.1.283). (2) **Version accumulation**: extension updates "first unpack the new-version directory, then delete the old one opportunistically", with the timing decided by each fork's own cleanup logic — measured, VS Code proper has already cleaned out 2.1.282/283 (only 2.1.284 remains), while Qoder still has at least 5 pairs of gitlens/python/go/debugpy/biome old and new coexisting, showing cleanup policies differ across forks; whether a "automatically clean old versions" user setting exists: unverified. (3) **Universal packages carry multiple platforms**: publishers ship a single "universal" target VSIX to save effort, containing binaries for macos/linux × x86_64/aarch64 + windows — 6 platforms total — and on a darwin-arm64 machine 5 of those platforms are pure dead weight (the two codex universal packages hold 719,166,144 B of non-native files combined); the control group is kimi-code: its manifest declares `bundledPlatform: darwin-arm64` with other platforms downloaded on demand, proving the waste is avoidable. Additionally, shipping *.map is "a bundler byproduct packed wholesale with dist/ with no pre-release filtering" — ms-toolsai.jupyter has three hash directories under `temp/scripts/`, each holding a byte-identical 11.79 MB map (verifiable with shasum), hard evidence that the packaging script does not filter; and JS engines never read .map at runtime.

### Windows

To be filled in by community contributions (see apps/index.md for path conventions)

### Linux

To be filled in by community contributions (see apps/index.md for path conventions)

## Memory issues

| Process | Pattern | Notes |
|------|------|------|
| No known issues recorded | — | Extensions live inside the editor main process / extension-host process; this scan (2026-09-30) did no per-extension process-level measurement; memoryNotes is empty |

## Cleanup recommendations

- **Safe** (no side effects if deleted; the software rebuilds / re-downloads on demand):
  - `*.map` files (≥100KB, about 377 MB) inside the 5 extension directories: `find ~/.vscode/extensions ~/.cursor/extensions ~/.qoder/extensions ~/.trae/extensions ~/.kiro/extensions -name "*.map" -size +100k` — only affects DevTools debug readability, zero functional difference; ⚠️ do not delete maps inside `.app` application bundles (see "Do not delete")
  - `~/.qoder/extensions/anthropic.claude-code-2.1.44-darwin-arm64/resources/native-binary/claude.zst` (38.9 MB; the extracted `claude` is right next to it)
  - `~/.vscode/extensions/ms-python.vscode-pylance-2026.4.1/dist/wasi/python-3.13.11.zip` and `python-3.14.7.zip` (28 MB combined; extracted sibling directories already exist)
  - Non-macos-aarch64 platform directories inside universal packages: under `~/.cursor/extensions/openai.chatgpt-0.4.71-universal/bin/` the `linux-aarch64`, `linux-x86_64`, `macos-x86_64`, `windows-aarch64`, `windows-x86_64` directories (353 MB, including the 81MB codex.exe), and the same-named directories under `~/.trae/extensions/openai.chatgpt-0.4.69-universal/bin/` (334 MB)
  - Old-version directories within `~/.qoder/extensions/`: `eamodio.gitlens-17.9.0-universal`, `ms-python.python-2025.16.0-darwin-arm64`, `ms-python.debugpy-2025.14.0-darwin-arm64`, `golang.go-0.52.1`, `biomejs.biome-3.3.0-universal`, etc. (the editor only loads the newest version)
- **Caution** (loses cache or packages awaiting runtime use; rebuilding has a cost; needs user confirmation):
  - The entire extensions directory of editors still in use: deleting triggers a full reinstall, and recovery is slow on poor networks (`extensions.json` will be rebuilt)
  - The 3 `cloudcode_cli.zip` files (535 MiB combined, paths in the table above): whether they are "extracted only at runtime" is unverified — if Gemini Code Assist needs to extract the CLI on first use, deleting means re-downloading
  - `~/.trae/extensions/moonshot-ai.kimi-code-0.3.1-darwin-arm64/bin/kimi/archive.tar.gz` (61 MB): a whole Python runtime archive used for first-run extraction
- **Do not delete** (user data / would break the software):
  - The **newest-version** directories of extensions in use, and the `extensions.json` index in each directory (deleting makes the corresponding extension stop working or require reinstalling)
  - Anything inside the editors' `.app` application bundles (modifying the bundle breaks code signing; Gatekeeper may block it and self-update verification fails) — extension directories have no such issue

## Upstream status

- Official cleanup options: no VS Code-family fork exposes a "automatically clean old extension versions" user setting (unverified); uninstalling from the panel or the `--uninstall-extension` command deletes the corresponding version directory; new-version directories are cleaned up on update in some forks (VS Code proper), while forks like Qoder demonstrably do not clean. The correct control group: kimi-code downloads per platform on demand rather than bundling all platforms; the right approach for *.map is hidden source maps for builds, filtered before release or uploaded to a crash platform (zero distribution to users).
- Related issues/PRs: unverified — this profile attaches no firsthand upstream issue links and cites none; the jupyter `temp/scripts/` triple copies, the five old/new pairs in .qoder, and the universal packages' 6-platform bundling are all first-hand local evidence (re-verified 2026-09-30), independent of external links.
