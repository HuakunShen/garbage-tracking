---
name: garbage-tracker-add-app
description: Add a new App dossier to the garbage-tracking database (disk waste + memory abuse). Use when the user names an app to document, or asks to grow the database / find more garbage apps — with no app named, discover the biggest untracked offenders on this machine automatically. Covers scanning, measuring, classifying, writing apps/<slug>/index.md, and evidence files.
---

# Add an App dossier to garbage-tracking

You are documenting one App in the garbage-tracking database: the garbage it leaves on disk AND its memory behavior. Everything you write must be measured, never guessed. You are a **read-only auditor**: scanning uses only read-only commands (`spacelens`, `du`, `dust`, `ls`, `find`, `ps`, `top`, `plutil`, `stat`); never delete, move, or modify anything outside the repo file you are writing.

## 0. Locate the database

1. The repo is `github.com/HuakunShen/garbage-tracking`. Find a local clone (check likely workspace/parent directories, `git remote -v` in candidates), or clone it, or ask the user for the path.
2. Read `apps/index.md` (entry schema + OS path conventions) and `CONTRIBUTING.md` (evidence rules) before writing anything.
3. Pick the **slug**: lowercase kebab-case of the app/tool name, unique among existing folders in `apps/`. Group related things into one dossier when they share the mechanism (e.g. all VS Code-family editors' extension directories → one `vscode-family-extensions` entry).

## 1. Pick the target

- **User named an app** → that one.
- **No app named (auto-discovery)** → scan this machine and rank candidates:
  1. List existing slugs (`ls apps/`) — do not re-document them.
  2. Probe the usual suspects per OS: on macOS `~/Library/Application Support`, `~/Library/Caches`, `~/Library/Containers`, `~/.cache`, `~/.npm`, `~/.local`, `/Applications` bundle sizes; on Linux `~/.cache`, `~/.config`, `~/.local/share`; on Windows `%LOCALAPPDATA%`, `%APPDATA%`.
  3. `spacelens scan <dir>` or `dust -d 2 <dir>` for a quick map, then `du -sh` the top entries.
  4. Shortlist 3–5 untracked offenders with sizes, tell the user, and proceed with the top one unless they pick otherwise.

## 2. Measure (all read-only)

Disk, per path:
- `du -sk <path>` for the exact KiB total (this is the number the dossier quotes) and `du -sh` for the human-readable form — state which you used.
- Drill into subdirectories (`du -sh <path>/*`) until you can say what each one IS: version pile-ups, caches, logs, SQLite databases, per-session/worktree directories, duplicate binaries, update installers.
- Check file counts (`ls | wc -l`) and mtimes (`ls -lat`, `find -newermt`) for growth patterns.

Memory:
- `ps aux` sorted by RSS, or `ps -axo pid,ppid,rss,etime,comm` — aggregate processes into app groups (main process + helpers + background services), summing RSS per group.
- Count processes per app; take **two samples ~30 seconds apart** when you suspect growth; note elapsed times (`etime`) to tell residents from fresh spawns.
- Note process-army patterns: per-session MCP servers, helper-per-tab, leftover daemons after the app quits.

Write raw commands + output into `apps/<slug>/evidence-<os>-<date>.txt` (or `.json`) as you go. Every number in the dossier must be traceable to this file.

## 3. Investigate mechanism and upstream

- For each growing path, explain WHY: no retention window, unbounded cache, per-session directories never reaped, self-update leaving old copies, duplicate runtimes. The mechanism is the "Design issue" paragraph.
- Check for official cleanup options (in-app settings, `brew cleanup`, `npm cache clean --force`, `pnpm store prune`, `rustup toolchain uninstall`, ...) and whether they exist/are documented — the app shipping a cleanup switch that nobody finds is itself a finding.
- Search upstream issue trackers when relevant. Anything you cannot confirm online is marked **unverified** — never fabricate issue links.

## 4. Write `apps/<slug>/index.md`

Follow the template in `apps/index.md` exactly. Frontmatter:

```yaml
---
title: <App name>
description: <ONE sentence: the most severe resource issue + magnitude, e.g. "~/.codex grew from 37.65 GiB to 156.7 GB in three days, with 106 GB reclaimable from agent worktrees alone">
category: <ai-coding|ai-chat|ide|editor|devtool|other>
os: [macos]                # ONLY systems you measured on
last-verified: "2026-09-30"   # QUOTE the date — unquoted YAML dates parse as Date objects and break the docs build
---
```

Body sections, in order:

1. `# <App name>` then a 2–4 sentence overall portrait (what it is, the worst problems with numbers, one-line conclusion).
2. `## Disk issues` → `### macOS` with the five-column table (Path / Type / Measured size / Delete-ability / Notes), every path measured on this machine, sizes matching the evidence file. Then `### Windows` and `### Linux` — if you did not measure them, keep the placeholder sentence "To be filled in by community contributions (path conventions in apps/index.md)".
3. A `**Design issue**:` paragraph per OS section explaining the mechanism.
4. `## Memory issues` table (Process / Pattern / Notes) — or "No known issues recorded" if genuinely clean. Never invent memory problems.
5. `## Cleanup recommendations` — every path sorted into **Safe** (no side effects, app rebuilds it) / **Caution** (re-downloadable or loses state — say what is lost) / **Do not delete** (user data). Describe, don't delete: no one-liner `rm` commands in the dossier.
6. `## Upstream status` — official cleanup options, relevant issues/PRs (only links you verified; otherwise "unverified").

Hard rules: **English only**; `~/` style paths, never `/Users/<name>/...`; numbers byte-identical to the evidence file; `~/Library/...` for macOS, `%LOCALAPPDATA%`/`~/.config` conventions for other OSes.

## 5. Verify

1. If the repo has `docs/`: `cd docs && bun install && bun run build` must pass — the site's schema validates every dossier (this is where a bad `last-verified` date or missing field fails).
2. Self-review: slug unique; description is ONE sentence with a magnitude; the three cleanup tiers present; memory section exists; every size traceable to the evidence file; no Chinese characters; frontmatter `os` lists only measured systems.

## 6. Report back to the user

- A table: path / type / size / tier.
- The total reclaimable estimate (zero-loss vs with-trade-offs, like the existing dossiers do).
- The files written, and the suggested next step: one PR per App (branch `apps/<slug>`), per CONTRIBUTING.md.
- If the user wants to actually clean: that is the `garbage-tracker` skill's job — propose paths and wait for explicit per-item confirmation; never delete on your own initiative.
