import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// The glob loader's default id generation special-cases a `slug` frontmatter
// field and uses *only* that as the id, dropping the rest of the path. Our
// frontmatter has exactly such a field (per-author-unique, not global), so
// force ids to the full relative path instead -- otherwise routes silently
// lose their world/author segments. (Bit us once already on the earlier
// Campaign Codex content model; see project memory.)
const generateId = ({ entry }: { entry: string }) => entry.replace(/\.md$/, "");

const postSchema = z.object({
  foundryUuid: z.string(),
  world: z.string(),
  blogUuid: z.string(),
  blogTitle: z.string(),
  title: z.string(),
  slug: z.string(),
  author: z.object({
    userId: z.string().nullable(),
    name: z.string(),
    image: z.string().nullable(),
    isGM: z.boolean(),
  }),
  authorSlug: z.string(),
  publishedAt: z.number(),
  updatedAt: z.number(),
});

export const collections = {
  // content/worlds/<world-slug>/blogs/<author-slug>/<post-slug>.md, content/
  // sitting at the repo root alongside this Astro project (not nested under
  // a site/ subdirectory) -- keeps host build config to "just build this
  // repo," no base-directory setting needed.
  posts: defineCollection({
    loader: glob({ pattern: "*/blogs/*/*.md", base: "./content/worlds", generateId }),
    schema: postSchema,
  }),
};
