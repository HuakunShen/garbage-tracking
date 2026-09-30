// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import {
  rehypeCode,
  remarkCodeTab,
  remarkHeading,
  remarkNpm,
  remarkStructure,
} from 'fumadocs-core/mdx-plugins';

// GitHub Pages project site: https://huakunshen.github.io/garbage-tracking/
// fumadocs picks this up through import.meta.env.BASE_URL (see src/lib/base.ts
// and the `url` option in src/lib/source.ts).
const site = 'https://huakunshen.github.io';
const base = '/garbage-tracking';

const remarkPlugins = [
  remarkHeading,
  remarkCodeTab,
  remarkNpm,
  [remarkStructure, { exportAs: 'structuredData' }],
];
const rehypePlugins = [rehypeCode, rehypeRepoLinks];

// Markdown pages (the apps/ database) link evidence files and repo docs with
// relative paths per the repo convention. Those files are not part of the
// site, so rewrite such links to GitHub blob URLs — keeping the repo files
// themselves portable.
const GITHUB_BLOB = 'https://github.com/HuakunShen/garbage-tracking/blob/main';
const REPO_FILE_RE = /\.(md|mdx|txt|json)$/;

function rehypeRepoLinks() {
  const rewrite = (href, sourcePath) => {
    if (!href || href.startsWith('#') || /^(https?:)?\/\//.test(href) || href.startsWith('mailto:')) {
      return href;
    }
    if (!REPO_FILE_RE.test(href.split('#')[0])) return href;

    const normalized = sourcePath.replace(/\\/g, '/');
    // Repo-relative directory of the file backing the current page.
    let baseDir;
    const appsMatch = normalized.match(/\/(apps\/[^/]+)\//);
    const docsMatch = normalized.match(/\/(content\/docs)\//);
    if (appsMatch) baseDir = appsMatch[1];
    else if (docsMatch) baseDir = docsMatch[1];
    else return href;

    const segments = baseDir.split('/');
    for (const segment of href.split('#')[0].split('/')) {
      if (segment === '' || segment === '.') continue;
      if (segment === '..') segments.pop();
      else segments.push(segment);
    }
    return `${GITHUB_BLOB}/${segments.join('/')}`;
  };

  const visit = (node, sourcePath) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'element' && node.tagName === 'a') {
      const href = node.properties?.href;
      if (typeof href === 'string') node.properties.href = rewrite(href, sourcePath);
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) visit(child, sourcePath);
    }
  };

  return (tree, file) => {
    if (typeof file.path === 'string') visit(tree, file.path);
  };
}

export default defineConfig({
  site,
  base,
  markdown: {
    processor: unified({
      syntaxHighlight: false,
      remarkPlugins,
      rehypePlugins,
    }),
  },
  integrations: [
    react(),
    mdx({
      extendMarkdownConfig: true,
      syntaxHighlight: false,
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
