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
  // blogSlug: unique per journal entry (disambiguated on collision) -- the
  // single-blog archive/permalink identity. authorSlug: shared across every
  // blog with the same displayed author name, deliberately NOT
  // disambiguated -- the cross-blog author archive identity. See
  // render.js/sync/ingest.js's assignSlugs for why these are kept distinct.
  blogSlug: z.string(),
  // Raw (unslugified) root text, e.g. "PCs/Act 1" -- the slugified version
  // is already folded into blogSlug's prefix; this is kept separately for
  // human-readable breadcrumb/section labels. null when there's no root.
  root: z.string().nullable(),
  title: z.string(),
  slug: z.string(),
  author: z.object({
    userId: z.string().nullable(),
    name: z.string(),
    image: z.string().nullable(),
    isGM: z.boolean(),
  }),
  authorSlug: z.string(),
  tags: z.array(z.string()),
  publishedAt: z.number(),
  updatedAt: z.number(),
  // Soft-delete tombstone: true once a previously-published post is
  // unpublished in Foundry. The file itself is never deleted (there's no
  // GitHub-delete step in the publish pipeline), so every query against
  // this collection must go through getPublishedPosts() in lib/posts.ts,
  // never getCollection("posts") directly, or a tombstoned post will
  // still render.
  unpublished: z.boolean(),
});

export const collections = {
  // content/worlds/<world-slug>/blogs/<blog-slug>/<post-slug>.md, where
  // <blog-slug> can itself be more than one path segment (a root path
  // prefix followed by the blog's own slug, e.g. "arc-1/session-notes") --
  // "**" rather than a single "*" between blogs/ and the filename, to match
  // any depth there, not just exactly one directory.
  posts: defineCollection({
    // Relative to the project root (this repo), not to this file's own
    // src/ directory -- content/ now lives inside this same repo
    // (wikiworld-site-template), not as a sibling one level up like it did
    // when the site was still developed inside the wikiworld dev repo.
    loader: glob({ pattern: "*/blogs/**/*.md", base: "content/worlds", generateId }),
    schema: postSchema,
  }),
};
