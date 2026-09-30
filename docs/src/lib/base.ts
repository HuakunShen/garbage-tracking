// Astro `base` as a plain string (no trailing slash): '/garbage-tracking' in
// production, '' when no base is configured. Shared by everything that builds
// URLs outside Astro's own routing (fumadocs hrefs, OG image meta, favicons).
export const BASE_URL = (import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '');

export function withBase(path: string): string {
  return path.startsWith('/') ? BASE_URL + path : path;
}
