---
title: App Database Guide
description: Entry schema, cross-OS path conventions, the three deletability tiers, severity levels, and entry creation rules
---

# App Database Guide

This directory (`apps/`) is the database itself: **one folder per App**, the folder name being the slug, with `index.md` as that folder's page body (following the fumadocs convention: **use `index.md`, not README, as the index**). This page defines the full entry schema, the path conventions for each OS, the deletability and severity tier definitions, and the entry creation rules. Read this page in full before creating or modifying entries.

## Entry schema

An entry = frontmatter + a fixed section structure. The template verbatim follows; to create a new entry, copy the whole block and fill it in:

````markdown
---
title: <App name>
description: <One sentence: the most severe resource issue + magnitude>
category: <ai-coding|ai-chat|ide|editor|devtool|other>
os: [macos]            # Systems with measured evidence; append windows / linux after adding evidence
last-verified: 2026-09-30
---

# <App name>

<Two or three sentences: what the software is, an overall picture of its resource issues, and a one-sentence conclusion (how much is reclaimable / what the memory pattern is)>

## Disk issues

### macOS

| Path | Type | Measured size | Deletability | Notes |
|------|------|----------|----------|------|
| ~/.xxx/ | Version pile-up | 3.2 GB | Safe (old versions) | ~200MB per version, never cleaned |

**Design issues**: <Why this happens at the mechanism level; whether upstream has an auto-cleanup option and whether it is on by default; links to related issues>

### Windows

<If you have measurements, fill in a table in the same format; otherwise write: To be supplemented by the community (path conventions in apps/index.md)>

### Linux

<Same as above>

## Memory issues

| Process | Pattern | Notes |
|------|------|------|
| xxx-helper | Resident / helper abuse | <Symptoms and quantification> |

<If no known issues, write: No records yet>

## Cleanup recommendations

- **Safe** (no side effects when deleted; the software rebuilds it itself): ...
- **Cautious** (loses caches or configuration, rebuilding has a cost, requires user confirmation): ...
- **Do not delete** (user data): ...

## Upstream status

- Official cleanup options: ...
- Related issues/PRs: ...
````

### Frontmatter fields

| Field | Required | Description |
|------|------|------|
| `title` | Yes | The app's official name, e.g. `Claude Code`, `Visual Studio Code`. Must match the `# <App name>` top-level heading |
| `description` | Yes | One sentence stating **the most severe resource issue + magnitude**, e.g. "~/.claude grows without bound to 6.7 GB". No marketing language, no vague words like "lots of garbage" |
| `category` | Yes | Enum, single choice: `ai-coding` (AI coding agents/CLIs), `ai-chat` (AI chat clients), `ide` (IDEs), `editor` (editors), `devtool` (build/package/language toolchains), `other` (everything else) |
| `os` | Yes | Array, **listing only systems with measured evidence**. Initially `[macos]`; append `windows` / `linux` only after adding measured evidence for the corresponding system. A system without measurements must never appear here |
| `last-verified` | Yes | `YYYY-MM-DD`, the date of the last measured verification of this entry (not the creation date). Refresh it on any substantive update |

### Body sections

- `# <App name>`: two or three sentences — what the software is, an overall picture of its resource issues, and a one-sentence conclusion (how much is reclaimable / what the memory pattern is). The conclusion must be derivable from the numbers in the tables below.
- `## Disk issues` → `### macOS` / `### Windows` / `### Linux`: one table per measured system, with five columns:
  - **Path**: the full path starting from `$HOME` or a standard root, ending in `/` or `\` to indicate a directory;
  - **Type**: why this directory grows, e.g. version pile-up, session pile-up, cache, logs, redundant backups, transcripts, etc.;
  - **Measured size**: the measured number on your machine + unit (GB/MB); methodology goes in the "Notes" column or supplementary materials;
  - **Deletability**: one of three tiers (see [below](#deletability-tiers)), optionally with a parenthetical condition, e.g. "Safe (old versions)";
  - **Notes**: a one-sentence supplement on the growth mechanism, magnitude breakdown, relation to official mechanisms, etc.
  - Immediately below the table, a **`**Design issues**:`** paragraph: why this happens at the mechanism level, whether upstream has an auto-cleanup option, whether it is on by default, links to related issues; write "unverified" for anything you cannot find — do not fabricate.
  - Sections for unmeasured systems keep the placeholder text: `To be supplemented by the community (path conventions in apps/index.md)`.
- `## Memory issues`: one three-column table — **Process** (process/executable name), **Pattern** (e.g. resident, helper abuse, leak, spikes), **Notes** (symptoms and quantification: when measured, how much RSS, what it grows with). If there are no known issues, write `No records yet`, optionally with one sentence on the sampling methodology (e.g. "2026-09-30 `ps aux` sampling showed no resident processes").
- `## Cleanup recommendations`: organized by the three tiers (see [below](#deletability-tiers)), with specific paths/files listed under each. **Give paths and rationale only; do not embed deletion commands like `rm`** — execution is handled by the [garbage-tracker skill](../skills/garbage-tracker/SKILL.md)'s per-tier confirmation flow.
- `## Upstream status`: official cleanup options provided upstream (name, default value, where to find them) and related issue/PR links (with owning repo and title; status such as open/closed stated honestly).

## Path conventions (cross-OS)

Paths in entries are **written in their expanded, real form**, with the corresponding environment/XDG variable noted where useful. Conventions per system:

| Purpose | Windows | Linux | macOS |
|------|---------|-------|-------|
| User-level cache | `%LOCALAPPDATA%\<App>\Cache` | `~/.cache/<app>` (`XDG_CACHE_HOME`) | `~/Library/Caches/<App>` |
| User-level config/data | `%APPDATA%\<App>` (roaming) | `~/.config/<app>` (`XDG_CONFIG_HOME`) | `~/Library/Application Support/<App>`; key-value config in `~/Library/Preferences/<App>.plist` |
| Local data (non-roaming) | `%LOCALAPPDATA%\<App>` | `~/.local/share/<app>` (`XDG_DATA_HOME`) | `~/Library/Application Support/<App>` |
| Logs/state | `%LOCALAPPDATA%\<App>\logs` | `~/.local/state/<app>` (`XDG_STATE_HOME`); older programs often write directly to `~/.cache` | `~/Library/Logs/<App>` |
| Temporary files | `%TEMP%` (i.e. `%LOCALAPPDATA%\Temp`) | `/tmp`; user-level `$TMPDIR` | `$TMPDIR` (e.g. `/var/folders/...`), `/tmp` |
| Machine/system-wide | `%PROGRAMDATA%\<App>` | `/var/lib/<app>`, `/var/cache/<app>`, `/var/log` | `/Library/Application Support/<App>` |

Notes:

- On Linux, when the various `XDG_*` variables are unset, the values in parentheses in the table above are the defaults; some programs do not follow XDG and create dot-directories directly under `$HOME` (e.g. `~/.npm`) — such "wild paths" are precisely what this database aims to record, so write them as they are;
- On Windows, `%LOCALAPPDATA%` expands to `C:\Users\<user>\AppData\Local` and `%APPDATA%` to `C:\Users\<user>\AppData\Roaming`; prefer the `%VAR%` form in entries, for reproducibility across machines;
- The same software's caches may be scattered across several convention locations — list them one by one; do not merge them into a vague "cache directory".

## Deletability tiers

**Deletability describes what happens if you delete the path, and is the sole basis for cleanup recommendations and safety confirmation.** The three tiers:

| Tier | Definition | Typical cases | Judgment criteria |
|----|------|----------|----------|
| **Safe** | No side effects when deleted; the software rebuilds it itself | Pure caches, regenerable temporary data, redundant copies (original still present) | Software works fine after deletion, rebuild is zero-cost or imperceptible; only mark this when fully certain |
| **Cautious** | Loses caches or configuration, rebuilding has a cost, requires user confirmation | Session history, indexes, download caches — deletion means re-downloading/rebuilding/losing replay capability | Functionality is intact but there is a real cost (time, bandwidth, history); the user must be informed and confirm before deletion |
| **Do not delete** | User data, never included in cleanup | User-written configuration/rules/skills, account state, chat history, project files | Anything carrying the user's personal content or account state is always this tier; when in doubt, treat it as this tier |

Rule: the **deletability column** in the disk issues table and the **three tiers in the cleanup recommendations** must correspond one to one — the same path must not be described inconsistently in the two places; when unsure between two tiers, downgrade to the more conservative one.

## Severity definition

Severity expresses **how severe the problem itself is**, used to unify the wording of each entry's "one-sentence conclusion" and `description`. Conventions:

- **The current template has no standalone severity field** — severity is expressed through the magnitude numbers in `description` and the measured sizes in the disk issues table; do not add your own fields to the frontmatter (the [entry schema](#entry-schema) verbatim is authoritative);
- Tier criteria (for descriptions, search, and future site filtering):

| Level | Disk (reclaimable) | Memory (resident / unbounded pattern) | Wording requirements |
|------|------------------|--------------------------|----------|
| **Severe** | ≥ 1 GB | ≥ 1 GB resident, or any unbounded growth pattern | `description` and the conclusion must give measured numbers |
| **Moderate** | 100 MB – 1 GB | 100 MB – 1 GB resident | Give numbers and state the growth conditions |
| **Minor** | < 100 MB | < 100 MB resident | Still recorded honestly, but `description` focuses on the pattern rather than the numbers |

- When an App's disk and memory issues fall into different levels, `description` takes the more severe dimension;
- Unmeasured adjectives like "huge", "insane", or "absurd" are banned — always replace them with numbers and mechanisms.

## Entry creation rules

1. **Evidence first, then an entry.** No entry without local measurements (measured sizes, command output, process names); other people's blogs and forum hearsay do not count as evidence — at most they are leads to verify on your own machine. Evidence methodology in [CONTRIBUTING.md](../CONTRIBUTING.md).
2. **One folder per App.** The slug is lowercase kebab-case (e.g. `claude-code`, `yarn-berry`), corresponding to the product's common name; one product shares one dossier across platforms, with OS differences in the entry's `### macOS` / `### Windows` / `### Linux` sections — do not split folders by system.
3. **`index.md` is the body.** The entry page is always named `index.md` (fumadocs convention), never `README.md`; do not create secondary documentation pages inside the entry folder either.
4. **Supplementary materials go in the same folder.** Files directly related to the entry — raw scan output, evidence snapshots, reproduction scripts — go in `apps/<slug>/`, named like `evidence-macos-2026-09-30.txt`, and referenced at the end of the `index.md` body with a one-line relative-path link; do not paste large raw output into the body; do not add or remove headings to make room for evidence; do not put them in other directories of the repo.
5. **The template is a contract.** The frontmatter fields and section structure follow the [template](#entry-schema) verbatim; do not add or remove level-1/level-2 headings; for sections without data, keep the placeholder text rather than deleting the section.
