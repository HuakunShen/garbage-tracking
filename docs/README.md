# garbage-tracking docs

The documentation site for the [garbage-tracking](https://github.com/HuakunShen/garbage-tracking) database, built with Astro + fumadocs.

- **Site pages** live in `content/docs/` (homepage, contributing guide).
- **The App Database** is loaded straight from the repo-root `../apps` directory — one folder per App, `index.md` as the page (see `src/content.config.ts` and `src/lib/source.ts`).
- Deployed to GitHub Pages at `https://huakunshen.github.io/garbage-tracking/` via `.github/workflows/deploy-docs.yml`.

## Develop

```bash
bun install
bun run dev
```

The dev server serves under `/garbage-tracking/` — the same base path as production, so links behave identically.

## Build

```bash
bun run build
bun run preview
```
