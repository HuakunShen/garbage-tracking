---
name: garbage-tracker
description: Use when the user wants to free up disk space, investigate memory/background process usage, or asks about a piece of software "why does it take up so much space / can it be deleted". It lets the AI check disk garbage and memory issues item by item against the verified App dossiers in the garbage-tracking repo (apps/*/index.md), produce a reclaimable-space list organized by the "Safe / Cautious / Do not delete" tiers, and only run cleanup after the user confirms each tier; new findings not yet in the database are channeled into a contribution PR.
---

# Garbage Tracker: disk and memory cleanup based on App dossiers

Your job: treat the repo's dossiers as "medical records", run a measured checkup on the user's machine, produce a list sorted by reclaimable space, and then clean up only under per-tier confirmation. **Throughout, you only detect and report; any deletion must first pass the safety rules below.**

## Step 0: Safety rules (highest priority; no step may violate them)

1. **Never delete automatically.** You have no deletion authority, only the right to propose. Every item pending deletion stays on the list until the user explicitly confirms it.
2. **Confirm each tier separately.** Cleanup recommendations are organized into "Safe / Cautious / Do not delete" tiers; the "Safe" tier and the "Cautious" tier must each be confirmed **separately** with the user — execute a tier only after receiving its own consent, and never merge the two tiers into one command. The "Do not delete" tier is listed only and never enters pending commands.
3. **User data is never included in cleanup.** Documents, photos, chat history, code repositories, browser bookmarks/passwords, and app-private data (databases, personal content stored in configuration) are never garbage. If you are unsure whether something is user data, treat it as if it is — i.e. do not delete it.
4. **Before deleting, list every item's full path and measured size.** Saying just "clear the cache" is not allowed; before executing, read out each `path → size` pair exactly as-is, fully matching the confirmed list, and after execution report each command's real output.
5. **Warn about consequences.** After cache-type directories are deleted, the related software's **first launch / first build will be noticeably slower** (re-downloading, rebuilding); this warning must accompany your report.
6. Even if the user says "clean it up for me", that only means going through the per-tier confirmation flow; it is not pre-authorization for any tier.
7. What you may do automatically: read-only detection (`ls`, `du`, `ps`, `spacelens scan`, `spacelens candidates`). Disk-modifying commands like `spacelens clean` may appear on the command line only after the corresponding tier has user confirmation.

## Step 1: Locate the dossier database

- All known App dossiers live in **the `apps/` directory of the garbage-tracking repo**; the `index.md` under each subfolder (the slug) is a dossier containing "Disk issues" (tables per OS), "Memory issues", and "Cleanup recommendations" (Safe / Cautious / Do not delete tiers).
- First check whether the repo already exists on this machine: look in and near the current working directory for something named `garbage-tracking`, or `ls` common code directories. If found, use it directly.
- If it is not on this machine, **`git clone` the repo first** (ask the user for the repo URL); if the user does not give a URL, **ask them to provide a local path**. Without the repo there is no basis for comparison — tell the user honestly and stop at this step; do not invent dossiers from memory.
- The dossier schema is described in the repo's `apps/index.md`; if that file does not exist yet (the database is still early), read and write following the structure of existing dossiers (e.g. `apps/bun/index.md`); do not invent your own format.

## Step 2: Identify the OS and enumerate installed software

1. First determine the operating system (`uname -s` / environment variables); all subsequent paths and commands follow the branch for that OS.
2. Enumerate installed software and data directories:
   - **macOS**: `ls /Applications`; `brew list --cask` (when Homebrew is present); `ls ~/Library/Application\ Support`
   - **Windows**: `%LOCALAPPDATA%`, `%APPDATA%`, the Programs list in "Settings → Apps" (or `ls "$env:LOCALAPPDATA"`, `ls "$env:APPDATA"`)
   - **Linux**: `ls ~/.config`, `ls ~/.cache`, `ls /usr/share`
3. Fuzzy-match the enumeration results against the **slugs under `apps/`**: ignore case and hyphen/space differences, and consider aliases (e.g. `zcode` ↔ "ZCode", `vscode` ↔ "Visual Studio Code", `yarn-berry` ↔ "Yarn"). For matches, use the corresponding dossier; for software with no match, **do not invent a dossier** — honestly mark it "not in the database".

## Step 3: Disk check

For each matched dossier:

1. Verify one by one whether the **paths in the dossier's "Disk issues" table actually exist on this machine** (with `ls` or `test -d`; if a path does not exist, skip it and note in the results "recorded in the dossier but absent on this machine").
2. **Measure sizes yourself**; copying the dossier's old numbers is not allowed:
   - Prefer `spacelens scan <path>` (or for cache-type directories, `spacelens candidates <path> --preset <node|rust|gitignored>` to get candidates);
   - If spacelens is not installed, use `du -sh <path>` (across multiple top-level entries, `du -sh <path>/* | sort -h`).
3. Summarize into one table, **sorted by reclaimable space, largest first**; "Safe" plus "Cautious" totals give the software's total reclaimable amount. Columns: software / tier (safe|cautious|do not delete) / full path / measured size / one-sentence note. Across multiple software, also sort by total reclaimable amount, descending.
4. Paths marked "Do not delete" in the dossier are still listed, so the user sees how much of the total is **not** garbage and does not form false expectations.

## Step 4: Memory check

1. Use `ps` to pull the full process list (`ps aux` or `ps -eo rss,comm,pid`), **aggregate RSS by process group** (sum the multiple processes of the same executable / same application; on macOS `ps` reports RSS in KiB — convert to MB/GB yourself), and list the top groups by usage, descending.
2. Compare against each dossier's **"Memory issues" section**: for hits, cite the dossier's conclusion to explain whose issue this is and how the dossier classifies it (a resident daemon, a leak, or by design); if the dossier says "No records yet" but the software has high-usage processes on this machine, say so honestly too.
3. Memory issues not in the database: tell the user **this issue is not yet in the database and a PR to supplement the dossier is welcome**, and follow Step 6 for the contribution loop.
4. You only read, never kill: `kill`/`pkill` are not in the default actions; when the user explicitly names a process to end, first explain what it is and what quitting would lose, then execute.

## Step 5: Reporting and cleanup execution

1. First give an overview: total reclaimable space, the per-software detail table (Step 3), the memory issue interpretation (Step 4), and unindexed software plus new findings on this machine.
2. Then request confirmation tier by tier:
   - "Safe" tier: list each `full path → measured size`, include the "first launch/build after deletion will be slower" warning, and execute after the user confirms;
   - "Cautious" tier: same as above, plus what will be lost and what the rebuild cost is, waiting separately for confirmation;
   - The two tiers are executed separately and their output reported separately; the "Do not delete" tier is not touched.
3. After executing deletions, re-measure (`du -sh` or `spacelens scan`) and report the actually freed amount.

## Step 6: Contribution loop

- **New software**, **disk paths missing from the dossier**, and **unrecorded memory issues**: all prompt the user that a PR to the repo is possible, and offer to draft it: create `apps/<slug>/index.md` following the schema in the repo's `apps/index.md`; if the schema file does not exist, follow the structure of an existing dossier (e.g. `apps/bun/index.md`) — with complete frontmatter (`title`/`description`/`category`/`os`/`last-verified`), "Disk issues" (tables per OS), "Memory issues", and "Cleanup recommendations" (three tiers) sections.
- **Write only what was measured on this machine**: record sizes and command output as they are; mark unverifiable upstream issue links "unverified" rather than fabricating; set `last-verified` to today's date. Attach raw data from the local scan (JSON or command output) as evidence.
- Submit the PR only after the user confirms; if the user does not want to, drop it — no pressure.
