interface PostRef {
  world: string;
  authorSlug: string;
  slug?: string;
}

export function postRoute(post: PostRef): string {
  return `/authors/${post.world}/${post.authorSlug}/${post.slug}/`;
}

export function authorRoute(post: PostRef): string {
  return `/authors/${post.world}/${post.authorSlug}/`;
}

export function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}
