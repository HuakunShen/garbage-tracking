import type { StaticSource } from 'fumadocs-core/source';
import { loader } from 'fumadocs-core/source';
import { type CollectionEntry, getCollection } from 'astro:content';
import * as path from 'node:path';
import { structure, type StructuredData } from 'fumadocs-core/mdx-plugins';

type DocEntry = CollectionEntry<'docs'>;
type AppEntry = CollectionEntry<'apps'>;
type MetaEntry = CollectionEntry<'meta'>;

// Site sections, in the order shown in the sidebar.
const CATEGORY_ORDER = ['ai-coding', 'ai-chat', 'ide', 'editor', 'devtool', 'other'];

// Lucide icon names (rendered as SVG by lucideIconsPlugin below).
const CATEGORY_ICONS: Record<string, string> = {
  'ai-coding': 'Bot',
  'ai-chat': 'MessagesSquare',
  ide: 'CodeXml',
  editor: 'PenLine',
  devtool: 'Wrench',
  other: 'Package',
};

const CATEGORY_LABELS: Record<string, string> = {
  'ai-coding': 'AI Coding Agents',
  'ai-chat': 'AI Chat Clients',
  ide: 'IDEs',
  editor: 'Editors',
  devtool: 'Toolchains & Dev Tools',
  other: 'Other',
};

// Astro emits pages under its `base`; fumadocs hrefs need the same prefix,
// injected through the `url` option (page slugs themselves stay unprefixed so
// routing and getStaticPaths remain base-agnostic).
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '');

export const source = loader({
  source: await createMySource(),
  baseUrl: '/',
  url: (slugs) => (slugs.length > 0 ? `${BASE}/${slugs.join('/')}` : `${BASE}/`),
});

export function getStructuredData(entry: CollectionEntry<'docs'>): StructuredData {
  return structure(entry.body);
}

async function createMySource() {
  const out: StaticSource<{
    metaData: MetaEntry['data'];
    pageData: (DocEntry['data'] | AppEntry['data']) & {
      _raw: DocEntry | AppEntry;
    };
  }> = {
    files: [],
  };

  for (const page of await getCollection('docs')) {
    const virtualPath = path.relative('content/docs', page.filePath!);

    out.files.push({
      type: 'page',
      path: virtualPath,
      data: {
        ...page.data,
        _raw: page,
      },
    });
  }

  // App dossiers. Astro slugifies "<slug>/index.md" to "<slug>", so each
  // dossier maps to a flat virtual file "apps/<slug>.md" (URL /apps/<slug>);
  // the schema guide is the folder index at apps/index.md.
  const apps = await getCollection('apps');
  for (const page of apps) {
    const isGuide = page.id === 'index';
    out.files.push({
      type: 'page',
      path: isGuide ? 'apps/index.md' : `apps/${page.id}.md`,
      data: {
        ...page.data,
        _raw: page,
        icon: isGuide
          ? page.data.icon
          : (CATEGORY_ICONS[page.data.category ?? 'other'] ?? '📦'),
      },
    });
  }

  for (const meta of await getCollection('meta')) {
    const virtualPath = path.relative('content/docs', meta.filePath!);

    out.files.push({
      type: 'meta',
      path: virtualPath,
      data: meta.data,
    });
  }

  // Sidebar for the App Database: the schema guide first, then apps grouped by
  // category (separator headings), alphabetical within each group.
  const dossiers = apps
    .filter((page) => page.id !== 'index')
    .map((page) => ({
      slug: page.id,
      title: page.data.title,
      category: page.data.category ?? 'other',
    }));

  const pages: string[] = ['index'];
  for (const category of CATEGORY_ORDER) {
    const group = dossiers
      .filter((dossier) => dossier.category === category)
      .sort((a, b) => a.title.localeCompare(b.title));
    if (group.length === 0) continue;
    pages.push(`---${CATEGORY_LABELS[category]}---`);
    for (const dossier of group) pages.push(dossier.slug);
  }

  out.files.push({
    type: 'meta',
    path: 'apps/meta.json',
    data: {
      title: 'App Database',
      description: 'One dossier per App: disk garbage and memory abuse.',
      icon: 'Database',
      pages,
    },
  });

  return out;
}
