import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { DocsPage, type DocsPageProps } from 'fumadocs-ui/layouts/docs/page';
import type { Root } from 'fumadocs-core/page-tree';
import type { ReactNode } from 'react';
import { navigate } from 'astro:transitions/client';
import { RootProvider } from 'fumadocs-ui/provider/astro';
import type { AstroProviderProps } from 'fumadocs-core/framework/astro';
import {
  Bot,
  CodeXml,
  Database,
  MessagesSquare,
  Package,
  PenLine,
  Trash2,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { BASE_URL } from '@/lib/base';
import SearchDialog from './search';

// The page tree arrives through astro-island JSON serialization, which cannot
// carry React elements — so the source layer keeps icon NAMES as strings and
// they are resolved to components here, on the client where Docs renders.
const ICONS: Record<string, LucideIcon> = {
  Bot,
  MessagesSquare,
  CodeXml,
  PenLine,
  Wrench,
  Package,
  Database,
};

function resolveTreeIcons(node: unknown): unknown {
  if (!node || typeof node !== 'object') return node;
  const next = { ...(node as Record<string, unknown>) };
  if (typeof next.icon === 'string' && ICONS[next.icon]) {
    const Icon = ICONS[next.icon];
    next.icon = <Icon className="size-4 shrink-0" />;
  }
  if (Array.isArray(next.children)) next.children = next.children.map(resolveTreeIcons);
  if (next.index) next.index = resolveTreeIcons(next.index);
  if (next.fallback) next.fallback = resolveTreeIcons(next.fallback);
  return next;
}

export function Docs({
  tree,
  children,
  pathname,
  params,
  page,
}: {
  tree: Root;
  children: ReactNode;
  pathname: string;
  params: AstroProviderProps['params'];
  page?: DocsPageProps;
}) {
  return (
    <RootProvider
      pathname={pathname}
      params={params}
      navigate={navigate}
      theme={{ enabled: false }}
      search={{ SearchDialog }}
    >
      <DocsLayout
        tree={resolveTreeIcons(tree) as Root}
        themeSwitch={{
          enabled: false,
        }}
        links={[
          { text: 'GitHub', url: 'https://github.com/HuakunShen/garbage-tracking' },
        ]}
        nav={{
          title: (
            <span className="flex items-center gap-2 font-semibold">
              <Trash2 className="size-4.5 text-fd-primary" aria-hidden />
              <span>garbage-tracking</span>
            </span>
          ),
          // the logo link must land on the site root under the Pages subpath
          url: `${BASE_URL}/`,
        }}
      >
        <DocsPage {...page}>{children}</DocsPage>
      </DocsLayout>
    </RootProvider>
  );
}
