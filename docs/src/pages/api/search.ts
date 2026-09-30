import type { APIRoute } from 'astro';
import { createFromSource } from 'fumadocs-core/search/server';
import { getStructuredData, source } from '@/lib/source';

const server = createFromSource(source, {
  buildIndex(page) {
    return {
      // entry ids collide across collections ("index" exists in both docs and
      // apps), so key search documents by their unique page URL instead.
      id: page.url,
      title: page.data.title,
      description: page.data.description,
      structuredData: getStructuredData(page.data._raw),
      url: page.url,
    };
  },
});

export const GET: APIRoute = () => {
  return server.staticGET();
};
