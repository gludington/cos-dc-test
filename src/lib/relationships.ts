import type { CollectionEntry } from "astro:content";
import { postRoute } from "./routes";

// Foundry's ProseMirror editor converts an author-typed `@UUID[...]{Label}`
// reference into a real `<a class="content-link" data-uuid="...">Label</a>`
// anchor at save time -- it has no real `href` at all; Foundry's own client
// JS intercepts clicks on `.content-link` elements to open the referenced
// document in-app. That JS doesn't exist on this static site, so passed
// through unchanged these render as inert, misleadingly link-colored dead
// ends. Same underlying Foundry behavior this project's earlier Campaign
// Codex work resolved (`resolveFoundryContentLinks`, parked on the
// `campaign-codex` git branch) -- reused here, not Campaign-Codex-specific.
//
// Matching is attribute-order-independent (the class and data-uuid
// attributes can appear in either order depending on how Foundry wrote
// them), same lightweight-regex approach as assets.ts's <img src>
// rewriting -- not worth a full HTML parser dependency for one attribute
// extraction.
const ANCHOR_RE = /<a\b([^>]*)>([\s\S]*?)<\/a>/g;
const CONTENT_LINK_CLASS_RE = /\bclass="[^"]*\bcontent-link\b[^"]*"/;
const DATA_UUID_RE = /\bdata-uuid="([^"]+)"/;

/** world-scoped, since Foundry UUIDs are only unique within one world/game
 * instance -- a multi-world site (see routes.ts) could otherwise, in
 * principle, collide two different worlds' random 16-char document ids.
 * Foundry's own `@UUID[...]` resolution never crosses worlds either, so
 * this also just matches Foundry's real semantics, not just paranoia. */
function linkKey(world: string, foundryUuid: string): string {
  return `${world}:${foundryUuid}`;
}

/** Builds the uuid -> site URL map once, from every currently-published
 * post -- pass this into resolveContentLinks() for every post in the same
 * build rather than reconstructing it per post (O(n) build, not O(n^2)
 * across the whole site). */
export function buildContentLinkMap(posts: CollectionEntry<"posts">[]): Map<string, string> {
  return new Map(posts.map((post) => [linkKey(post.data.world, post.data.foundryUuid), postRoute(post.data)]));
}

/** Rewrites every Foundry content-link anchor in `html`: a reference to
 * another currently-published post becomes a real link to it; a reference
 * to anything else (not published, wrong/foreign uuid, or a non-journal
 * document type like an Actor or Item, which this site never has a page
 * for) is unwrapped to its plain label text instead of left as a dead
 * link. Deliberately not a distinct "broken link" style: a dead link that
 * looks real invites a click that goes nowhere, which reads as broken to
 * a visitor; plain text just reads as a name. This also self-heals with
 * no action needed on the referencing post -- once the target page is
 * itself published, the next site rebuild alone turns it into a real
 * link, since resolution happens here at build time against whatever is
 * currently in `uuidToUrl`, not once at Foundry-publish time. */
export function resolveContentLinks(html: string, world: string, uuidToUrl: Map<string, string>): string {
  return html.replace(ANCHOR_RE, (full, attrs: string, label: string) => {
    if (!CONTENT_LINK_CLASS_RE.test(attrs)) return full; // an ordinary link, not a Foundry content-link -- leave it alone
    const uuidMatch = attrs.match(DATA_UUID_RE);
    if (!uuidMatch) return full;
    const url = uuidToUrl.get(linkKey(world, uuidMatch[1]));
    return url ? `<a href="${url}">${label}</a>` : label;
  });
}
