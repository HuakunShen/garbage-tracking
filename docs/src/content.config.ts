import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const docs = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    icon: z.string().optional(),
  }),
});

// The database itself: the repo-root apps/ directory, one folder per App with
// index.md as the page body. Loaded directly so the site always matches the repo.
const apps = defineCollection({
  loader: glob({ pattern: '**/*.md', base: '../apps' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    icon: z.string().optional(),
    category: z
      .enum(['ai-coding', 'ai-chat', 'ide', 'editor', 'devtool', 'other'])
      .optional(),
    os: z.array(z.string()).optional(),
    // YAML parses unquoted dates (last-verified: 2026-09-30) as Date objects.
    'last-verified': z.coerce.string().optional(),
  }),
});

const meta = defineCollection({
  loader: glob({ pattern: '**/*.{json,yaml}', base: './content/docs' }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    pages: z.array(z.string()).optional(),
    icon: z.string().optional(),
  }),
});

export const collections = {
  docs,
  apps,
  meta,
};
