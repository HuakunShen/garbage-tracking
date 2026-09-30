# Contributing Guide

This repo has only one hard rule: **evidence first, then an entry**. All sizes, paths, and process names must come from measurements on your own machine. Before starting, read [`apps/index.md`](apps/index.md) — the entry template, path conventions, deletability, and severity tiers are all defined there; this document covers only process and methodology, not the schema.

## PR process

1. **Fork and create a branch.** Name the branch by change type: `apps/<slug>` (create or modify a dossier), `docs/...` (documentation), `schema/...` (template/schema changes — open an issue to discuss first).
2. **Create a new entry**: copy the template verbatim from [`apps/index.md`](apps/index.md) into `apps/<slug>/index.md` (slug in lowercase kebab-case); put supplementary evidence files (raw scan output, etc.) in **the same folder**, and reference them with relative paths in the body.
3. **Modify an existing entry**: only change the parts you measured/verified yourself; if you touch data for a given OS, update the frontmatter `os` and `last-verified` accordingly.
4. **Self-review**: go through the template and field descriptions in [`apps/index.md`](apps/index.md) item by item — all frontmatter fields present, section structure unchanged, the three-tier wording consistent between the "disk issues table" and "cleanup recommendations", all links working, dates in `YYYY-MM-DD` format. Preview the Markdown anywhere to confirm tables render correctly (the future fumadocs site will use `apps/<slug>/index.md` directly as the page — broken tables mean a broken page).
5. **Submit the PR.** One PR does one thing: create one App, add one dimension to one App, or fix one documentation issue. The PR description must state (see [Evidence requirements](#evidence-requirements) below):
   - The measured machine and OS version (e.g. `macOS 15.5, Apple Silicon`);
   - The exact command used for each key number;
   - The measurement date;
   - For new entries, key `du` / `ps` output (pasted in the PR or placed in an evidence file in the entry folder).
6. **Review and merge.** Maintainers check: whether numbers and methodology are self-consistent, whether links are real, whether the three-tier classification matches the definitions, and whether `os` lists only measured systems. After merging, `last-verified` is treated as the repo-level endorsement date.

## Evidence requirements

- **Measure it yourself.** Copying others' numbers is forbidden, as is "I read online" style citation. Every number written into an entry should be reproducible on your machine with a single command.
- **State the methodology.** Record the measurement method and key parameters, and put them in the table's "notes" column, the design-issues paragraph, or an evidence file:
  - Disk: `du -ck` (exact KiB sum) or `du -sh` (human-readable) — state which one you used; if spot-checking some subdirectories, state the coverage;
  - Memory: `ps aux` / `ps -eo rss,comm` RSS is in KiB — note the MB/GB conversion; for multiple same-named processes, **sum** them and report per process group; state the sampling time (a single point is not enough to conclude whether something is resident or not — describe it honestly).
- **State the date.** frontmatter `last-verified` = the date of the last measured verification (`YYYY-MM-DD`); for long-span audits or multiple measurements, add specific dates in the table's "notes" column (the practice of this repo's existing entries).
- **Verify upstream links.** Before pasting an issue/PR link, open it and confirm it exists and its content; include the owning repo, title, and status (open / closed as not planned, etc.); anything you cannot find or don't remember clearly is marked "unverified" — never fabricate.
- **Evidence files may be committed.** When raw output is long, store it as `apps/<slug>/evidence-<os>-<date>.txt` (or `.json`) and reference it from `index.md`; do not paste huge files into the body.
- **Describe, don't delete.** Do not provide one-click deletion scripts like `rm -rf` in entries or PRs; paths and rationale go through the [garbage-tracker skill](skills/garbage-tracker/SKILL.md)'s per-dossier confirmation flow.

## Cross-OS addition guide

Entries are currently based mostly on macOS evidence; here is how to add Windows / Linux:

- **Fill in the table in the corresponding section only; do not create separate files.** To add Windows, edit the entry's `### Windows` section; same for Linux; replace the placeholder text `To be supplemented by the community (path conventions in apps/index.md)` with a five-column table in the **same format** as macOS (path / type / measured size / deletability / notes), and add a **`**Design issues**:`** paragraph below the table. Creating side pages like `apps/<slug>/windows.md` is forbidden.
- **Follow the path conventions.** Each OS's directory conventions (%LOCALAPPDATA%, %APPDATA%, ~/.config, ~/.cache, etc.) are in the path convention table in [`apps/index.md`](apps/index.md); the same software may have different paths and different symptoms on different systems — measure and fill in separately, and do not port macOS conclusions over.
- **Update the frontmatter after adding.** Append `windows` / `linux` to the `os` array (only the one you measured); refresh `last-verified`; if a new path belongs in the cleanup recommendations, add it to the appropriate tier.
- **Memory issues have no per-OS sections**: add a row to the `## Memory issues` table and note in the "notes" column which OS it was measured on.

## Writing conventions

- **Language**: English is the primary language of this repo; software names, commands, and config keys stay in their original form. Put a space between numbers and units (`5.1 GB`; the compact style of `200MB` is also acceptable, but be consistent within a single entry).
- **Punctuation**: standard English punctuation; code, paths, and commands always go in backticks.
- **Numbers**: give measured values and units as they are; thousands separators are fine (`1,846 items`); no unmeasured adjectives ("huge" → write the number, "never cleaned" → describe the mechanism and evidence).
- **Tables**: disk issue tables and memory issue tables follow the template's column order; paths inside table cells may omit backticks, but must have them in body text.
- **Dates**: always `YYYY-MM-DD`.
- **Person**: do not write "I" or "the author"; use subjectless statements; conclusion sentences like "about 1.6 GB reclaimable with zero loss, or up to about 6.6 GB if session history loss is acceptable".
- **Links**: external links use Markdown links with full titles; internal references prefer relative paths (`apps/index.md`, `../CONTRIBUTING.md`).
- **description**: one sentence = the most severe resource issue + magnitude; it is the summary on list pages and the future site index — worth rewriting a couple of times.
