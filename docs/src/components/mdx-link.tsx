import type { AnchorHTMLAttributes } from 'react';
import { BASE_URL } from '@/lib/base';

const REPO_URL = 'https://github.com/HuakunShen/garbage-tracking';

// Repo-relative path of the file that backs the current page, so relative
// links to repo files (evidence logs, CONTRIBUTING.md, the skill) resolve to
// GitHub instead of dead URLs on the site.
function repoPathForPage(pageSlug: string): string {
  if (pageSlug === 'apps') return 'apps/index.md';
  if (pageSlug.startsWith('apps/')) return `${pageSlug}/index.md`;
  return `content/docs/${pageSlug || 'index'}.mdx`;
}

function resolveRelativeRepoPath(pageSlug: string, href: string): string {
  const segments = repoPathForPage(pageSlug).split('/').slice(0, -1);

  for (const segment of href.split('#')[0].split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') segments.pop();
    else segments.push(segment);
  }

  return segments.join('/');
}

export default function MdxLink({
  href,
  children,
  pageSlug = '',
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { pageSlug?: string }) {
  if (!href) return <a {...rest}>{children}</a>;

  if (href.startsWith('#') || /^(https?:)?\/\//.test(href) || href.startsWith('mailto:')) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }

  if (href.startsWith('/')) {
    return (
      <a href={BASE_URL + href} {...rest}>
        {children}
      </a>
    );
  }

  if (/\.(md|mdx|txt|json)$/.test(href.split('#')[0])) {
    return (
      <a href={`${REPO_URL}/blob/main/${resolveRelativeRepoPath(pageSlug, href)}`} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}

// Build the per-page anchor component in React land: an inline arrow written
// directly in a .astro template would be compiled by Astro's own JSX runtime,
// and its elements cannot be rendered by react-dom.
export function makeMdxLink(pageSlug: string) {
  return function MdxLinkForPage(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
    return <MdxLink {...props} pageSlug={pageSlug} />;
  };
}
