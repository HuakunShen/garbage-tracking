import { createGetUrl } from 'fumadocs-core/source';
import { withBase } from '@/lib/base';

export const docsImageRoute = '/og/docs';

const getImageUrl = createGetUrl(docsImageRoute);

export function getPageImageUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'image.webp'];

  return { segments, url: withBase(getImageUrl(segments, page.locale)) };
}
