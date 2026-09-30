---
title: VS Code
description: The data-directory tree totals 5.1 GB, of which about 1.2 GB is discard-after-install AI extension installers and rebuildable V8 caches; the process tree has 22 processes / RSS 2.7–3.7 GB — a many-process accumulation profile
category: editor
os: [macos]
last-verified: 2026-09-30
---

# VS Code

Visual Studio Code is Microsoft's open-source Electron-based code editor, and the common foundation of a host of AI IDEs such as Cursor/Windsurf. Its resource profile is heavy on both ends: on disk, the whole `~/Library/Application Support/Code` tree is 5.1 GB (measured with `du -sh`), of which about 1.2 GB — extension installer caches + V8 caches — can be cleaned losslessly, while Chromium web storage (WebStorage + Partitions) at 2.9 GB requires re-login if deleted; inside the app bundle, two different versions of the Copilot runtime also sit side by side (runtime.node 79M + 69M). On memory it is the classic Electron many-process accumulation: 22 processes in the whole tree, RSS 3.68 GB (at scan time) to 2.7 GB (on recheck), with each window getting its own resident, TTL-less Codex app-server and pylance language server. Conclusion: **about 1.2 GB cleanable losslessly, plus about 3.2 GB more in the caution tier; no memory leak — the strength is in the sheer number of processes**.

## Disk issues

### macOS

| Path | Type | Measured size | Delete-ability | Notes |
|------|------|----------|----------|------|
| ~/Library/Application Support/Code/CachedExtensionVSIXs/ | Installer cache | 776 MB | Safe | The original .vsix packages, discarded once the extension is installed — mostly AI extensions: openai.chatgpt 263M, google.geminicodeassist 179M, anthropic.claude-code 98M, kilocode 97M (measured 2026-09-30 with `ls -lahS`) |
| ~/Library/Application Support/Code/CachedData/ | Rebuildable cache | 398 MB | Safe | V8 code cache, one directory per VS Code version (commit hash); automatically rebuilt at next startup after deletion |
| ~/Library/Application Support/Code/WebStorage/ | Web storage | 1.6 GB | Caution | localStorage/IndexedDB kept by Chromium for webview/web extensions; after deletion, web extensions require re-login and state is lost |
| ~/Library/Application Support/Code/Partitions/ | Web storage | 1.3 GB | Caution | Same as above, webview partition storage; together with WebStorage, 2.9 GB — the two biggest chunks in this tree |
| ~/Library/Application Support/Code/agent-host/ | Embedded SDK cache | 285 MB | Caution | Almost entirely sdk-cache (285M), holding embedded third-party agent SDK native binaries (research measured a 245M Claude Agent SDK claude/0.3.220); re-downloaded after deletion |
| ~/.vscode/extensions/ | Installed extensions + old-version leftovers | 2.3 GB (recheck) / 2.5 GB (at scan) | Caution | The installed extensions themselves, not a cache; at scan time anthropic.claude-code 2.1.282+2.1.283 were measured coexisting (223M+225M); the 2026-09-30 recheck found them cleaned, only 2.1.284 remaining, with an `.obsolete` marker file present |
| /Applications/Visual Studio Code.app/Contents/Resources/app/{extensions/copilot/node_modules/@github/copilot/sdk,node_modules.asar.unpacked/@github/copilot-sdk-darwin-arm64}/prebuilds/darwin-arm64/runtime.node | Redundant copies inside the bundle | 79M + 69M (exactly 83,356,944 B + 72,425,936 B) | Do not delete | Two different versions of the Copilot runtime coexist inside the same .app; manual deletion breaks code signing — should be resolved via official updates |

Also: `Code/Crashpad` 50 MB, `Code/logs` 5.4 MB (measured 2026-09-30 with `du -sh`; logs reached 57M at scan time, showing logs are rotated and cleaned).

**Design issue**:
- **CachedExtensionVSIXs**: after VS Code downloads a .vsix from the marketplace and installs it, the original installer package stays in this directory; it is only replaced when the extension next updates (research measured claude-code 2.1.282/2.1.283 coexisting on 9/27, replaced by the single 2.1.284 package by 9/30). The "current version" installer's only purpose after install is repair-reinstall, yet it is kept indefinitely; AI extensions run 100–263 MB each, pushing this traditionally KB-scale cache into the GB range. Upstream has no automatic cleanup option (unverified whether a relevant setting or issue exists).
- **CachedData**: V8 generates one cache directory per VS Code version, named by commit hash (`ls` measured 10+ hash directories); whether old-version directories are auto-deleted on upgrade is unverified.
- **WebStorage / Partitions**: Electron/Chromium writes webview and web-extension site data into these two trees, which only grow, with no cap; VS Code provides no way to empty them — only manual deletion, accepting the re-login cost.
- **agent-host/sdk-cache**: VS Code's agent features cache third-party agent SDK binaries per version; whether old versions are automatically reclaimed is unverified.
- **Dual runtime.node in the bundle**: in the npm dependency tree, `@github/copilot` (a direct dependency inside the extension) and the standalone platform package `@github/copilot-sdk-darwin-arm64` (in node_modules.asar.unpacked) are not version-aligned, and at packaging time both prebuilds went into the .app (both files' mtime is 2026-09-25 12:20). The fix depends on upstream aligning versions and is not a user-side cleanup item.

### Windows

To be filled in by community contributions (see apps/index.md for path conventions)

### Linux

To be filled in by community contributions (see apps/index.md for path conventions)

## Memory issues

| Process | Pattern | Notes |
|------|------|------|
| Code Helper (Plugin) ×9 | Electron helper multi-process / accumulation by count | At scan time, 9 Plugin helpers (including 2 pylance servers at 237–284 MB RSS each) + 7 Renderers; whole tree 22 processes / 3.68 GB RSS. The 2026-09-30 recheck also showed 22 processes, RSS total 2.7 GB, pylance then at 76–107 MB. No single process is large — usage = one set of processes per window × window count |
| codex app-server (openai.chatgpt extension) | Resident helper / no TTL | Each window spawns a `codex -c features.code_mode_host=true app-server` (scan pids 8146/11205, 77–79 MB each, resident since boot for 1h27m+; recheck showed 2 at about 66 MB each), living as long as its window with no idle reclaim; same binary family as the ChatGPT desktop app's built-in Codex. Currently no sign of a leak — a long-resident footprint |

**Design issue**: Electron forks a full set of main/GPU/utility/renderer processes per window; language servers (pylance) and AI agent services (codex app-server) all run as per-window resident helpers, with no cross-window sharing or idle-exit mechanism — closing surplus windows is the only effective way to reclaim memory. Whether all helpers exit when their window closes is unverified.

## Cleanup recommendations

- **Safe** (no side effects if deleted; the software rebuilds on its own):
  - `~/Library/Application Support/Code/CachedExtensionVSIXs/` — the whole directory can be deleted; it is only re-downloaded the next time an extension needs "repair-reinstall", otherwise never used (about 776 MB, this profile's largest lossless win)
  - `~/Library/Application Support/Code/CachedData/` — the whole directory can be deleted; the V8 cache is automatically rebuilt at next startup (about 398 MB)
  - `~/Library/Application Support/Code/Crashpad/`, `~/Library/Application Support/Code/logs/` — crash dumps and logs (50M + 5.4M)
- **Caution** (loses cache or config; rebuilding has a cost; needs user confirmation):
  - `~/Library/Application Support/Code/WebStorage/` + `~/Library/Application Support/Code/Partitions/` — 2.9 GB combined; after deletion all web extensions need re-login and state inside webviews is lost
  - `~/Library/Application Support/Code/agent-host/sdk-cache/` — after deletion the agent features must re-download hundreds of MB of SDKs
  - Old-version directories inside `~/.vscode/extensions/` — uninstall one by one or let the `.obsolete` mechanism clean them; do not delete the whole directory (whole-directory deletion = uninstalling every extension)
- **Do not delete** (user data):
  - `~/Library/Application Support/Code/User/` (604 MB) — settings, keybindings, extension config, workspaceStorage and other user data
  - Current-version extensions in `~/.vscode/extensions/` — these are installed extensions, not garbage
  - Anything inside the `Visual Studio Code.app` bundle — including the dual runtime.node noted above; manual deletion breaks signing, wait for official updates

## Upstream status

- Official cleanup options: none found. VS Code has no "clear caches" setting; the built-in automatic cleanup is limited to replacing the old VSIX after extension updates, `.obsolete` marking old extension versions for delayed deletion, and log rotation (research measured logs dropping from 57M to 5.4M). Whether hidden settings or newer-version changes exist is unverified.
- Related issues/PRs: this profile is written from local read-only measurements and research files, with no upstream issue search performed; whether VSIX-cache non-cleanup and the Copilot SDK's dual prebuilds already have corresponding issues is unverified.

Evidence files: scan evidence summary, research document sources, and local recheck command records are in [evidence-macos-2026-09-30.txt](evidence-macos-2026-09-30.txt).
