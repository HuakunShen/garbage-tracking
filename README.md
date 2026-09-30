# garbage-tracking

A **community-maintained database tracking software resource waste**: it documents the garbage software leaves on disk (caches, sessions, logs, and versions that pile up without limit) and its bad habits in memory (runaway residents, helper abuse, leaks). **One dossier per App, covering both disk and memory** — because "why did this tool eat up my disk" and "why does it sit on 2 GB of memory as a resident process" are two sides of the same problem.

Positioning principles:

- **Empirical evidence only**. Every data point comes from measurements taken on a contributor's own machine (command + methodology + date); hearsay is not accepted;
- **Describe, don't delete**. Each dossier gives paths, magnitudes, and a three-tier classification of "safe / cautious / do not delete"; any deletion is performed by the user, after per-dossier confirmation;
- **The directory is the documentation**. Under `apps/`, each App gets one folder, and `index.md` is the page body (following the fumadocs convention — README is not used as the index), so it can be rendered directly into a website in the future.

## Repository structure

```
garbage-tracking/
├── README.md                  # This file: project positioning and overview
├── CONTRIBUTING.md            # Contribution guide: PR process, evidence requirements, writing conventions
├── apps/                      # The database itself: one folder (slug) per App
│   ├── index.md               # Database description page: entry schema, path conventions, tier definitions, entry creation rules
│   └── <slug>/
│       └── index.md           # The App's dossier body (schema described in apps/index.md)
├── skills/
│   └── garbage-tracker/
│       └── SKILL.md           # Installable skill: lets an AI agent run disk/memory checkups and cleanups on your machine according to the dossiers
└── reports/                   # Archive of scan reports (planned, see roadmap)
```

Which Apps are included? Look directly at the [`apps/`](apps/) directory; for what each dossier looks like and how to fill in the fields, see [`apps/index.md`](apps/index.md).

## Installing and using the garbage-tracker skill

`skills/garbage-tracker/` is a skill that can be installed directly into AI coding tools: once installed, ask the agent to "help me clean up disk garbage / investigate memory usage", and it will read the dossiers in this repo, run measurements on your machine (`du`, `ps`, etc.; if the spacelens scanning tool is installed locally, its read-only scanning commands are preferred), produce a list sorted by reclaimable space, and **only act after getting your confirmation dossier by dossier**; new findings on your machine will be channeled into PRs to this repo.

Installation:

```sh
# 1. Clone this repo (the dossier database must be on your machine; the skill relies on it)
git clone https://github.com/HuakunShen/garbage-tracking.git

# 2. Copy (or symlink) the skill directory into your AI tool's skills directory,
#    keeping the folder name garbage-tracker:
#    - Claude Code: ~/.claude/skills/
#    - ZCode and other tools: see each tool's documentation for its skills directory
cp -R garbage-tracking/skills/garbage-tracker ~/.claude/skills/

# 3. Start a new session and say: "help me clean up disk garbage"
```

Safety boundaries (built into the skill, see [SKILL.md](skills/garbage-tracker/SKILL.md) for details): never delete automatically; the "safe" and "cautious" tiers are confirmed separately; user data is never included in cleanup; full paths and measured sizes are listed item by item before execution.

## How to contribute

The database grows on real measurements — contributions are welcome. Full rules in [CONTRIBUTING.md](CONTRIBUTING.md); the essentials:

1. **Evidence first, then an entry**: sizes, paths, and process names must come from measurements on your own machine, with the command, methodology, and date stated;
2. **One folder per App**: create `apps/<slug>/index.md` using the template in [`apps/index.md`](apps/index.md), and put supplementary materials (raw scan output, etc.) in the same folder;
3. **For cross-OS additions, only fill in systems you actually measured**: fill in the table in the entry's corresponding `### Windows` / `### Linux` section; do not create separate files;
4. One PR does one thing (create one App, or add one dimension to one App), with the measurement environment and methodology stated in the PR description.

## Roadmap

- [x] **fumadocs documentation site**: the `apps/` directory is rendered as a website in [`docs/`](docs/) (Astro + fumadocs) — deployed to <https://huakunshen.github.io/garbage-tracking/> via GitHub Actions on every push to `main`;
- [ ] **reports/ scan report archive specification**: define the storage format for each scan report, accumulate growth curves over time, so claims like "this directory grew 3 GB in six months" can be traced to evidence;
- [ ] **Windows / Linux empirical expansion**: entries are currently based mostly on macOS evidence; gradually fill in the two other platforms (path conventions are ready, see [`apps/index.md`](apps/index.md));
- [ ] **category and coverage expansion**: cover disk and memory issues of more `ai-chat`, `editor`, and `other` software;
- [ ] **schema validation**: CI lint on frontmatter and section structure to block entries that deviate from the template.
