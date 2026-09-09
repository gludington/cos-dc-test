# Design system

Two files, plus component-local styles:

- **`tokens.css`** — every value a theme can override: colors, fonts, and two shape variables.
  Just custom properties on `:root`, nothing else. Single fixed light palette — no
  `prefers-color-scheme: dark` block.
- **`base.css`** — global resets and the *visual* styling (color, font, borders) for every
  reusable class, all as `var(--color-...)` references. It does **not** own layout/spacing for
  most components anymore — see "Where structural CSS lives" below.
- **Component-local `<style>` blocks** — `ContentPanel.astro`, `Breadcrumbs.astro`,
  `Pagination.astro`, and a few page files (`[...blog].astro`, the tag archive page) each carry
  their own scoped `<style>` for structural layout (flex/grid, gaps, margins). The intent (see
  `Pagination.astro`'s own comment): "Keep the structural flex/grid containers local to the
  layout element! The visual tokens (borders, fonts, colors) stay inherited from base.css."

Both shared files are imported once, in `layouts/Layout.astro`, and apply site-wide.

## How theming works

`layouts/Layout.astro` loads a theme (configured via the Foundry module's site-wide settings →
written to `content/site-config.json` → resolved to a URL by `lib/config.ts`'s
`resolveThemeUrl()`) as a plain `<link rel="stylesheet">`, and a theme only needs to redeclare
`:root` custom properties to reskin the site (see `themes/parchment.css` in the repo root for an
example — **note:** that file currently targets an older variable set, see "Known gaps" below).

**Change from an earlier version of this doc:** `base.css` no longer wraps its rules in
`@layer base`. Previously that was deliberate — an unlayered stylesheet always beats a layered
one regardless of specificity or document order, which is what let a theme reliably override the
built-in default no matter where Astro placed either `<link>` in the output. With that wrapper
gone, `base.css` and a theme's stylesheet are both plain unlayered CSS now, so whichever the
browser considers as-if-later (by cascade order in the actual rendered `<head>`) wins on any rule
that overlaps in specificity — no longer a guarantee. Themes that only set `:root` custom
properties (the recommended, documented approach) are unaffected by this either way, since
`var(--x)` always resolves to whatever the property currently is regardless of rule order.

If you're hosting a custom theme file yourself: it must be served with a real `text/css`
Content-Type. `raw.githubusercontent.com` sends `text/plain` with
`X-Content-Type-Options: nosniff`, which makes browsers silently refuse to apply it — confirmed
live. jsDelivr's GitHub proxy (`cdn.jsdelivr.net/gh/<owner>/<repo>@<branch>/<path>`) serves the
same file with the correct MIME type.

## Token reference (`tokens.css`)

| Token | Value | Used for |
|---|---|---|
| `--color-font-heading` | `'Cinzel', 'Georgia', serif` | `h1`, `.site-title`, `.crumbs`, `.panel-title`, `.entry-title`, `.article-title`, prose headings, table headers |
| `--color-font-body` | `'EB Garamond', 'Garamond', serif` | `body`, `.meta`, prose paragraphs/tables |
| `--color-bg` | `#fdfaf2` | Page background; also the text color on `.prose th` (dark accent background) |
| `--color-card-bg` | `#f5eedc` | `.empty-state`, `.prose blockquote`, `.tag-item:hover` background |
| `--color-text-main` | `#2b1f14` | Body text, link hover color, `.meta a`, `.entry-title:hover`, `.pagination-status` |
| `--color-text-muted` | `#5c534c` | `.meta`, `.tag-label`, `.tag-sep`, `.pagination .disabled`, `.tag-count` |
| `--color-accent` | `#5c1d16` | Links, headings, `.panel-title`/`.article-title` borders-and-text, `.prose blockquote` left border, `.prose th` background |
| `--color-border` | `#b89047` | Every hairline border/rule (`h1`, `.panel-title`, `.pagination`, `.prose h1`/`h2`, `.empty-state`, avatars) |
| `--card-radius` | `0px` | Consumed via `var(--card-radius, 0px)` on `.empty-state` — sharp corners by default |
| `--avatar-radius` | `0px` | Consumed via `var(--avatar-radius, 0px)` on `.avatar` — square avatars by default |

Two more variables are *consumed* (with fallbacks) but never *set* in `tokens.css` — a theme can
define them to opt into an effect the built-in default doesn't use:

| Token | Fallback when unset | Used for |
|---|---|---|
| `--avatar-border` | `1px solid var(--color-border)` | `.avatar`, `.article-header .avatar` |
| `--card-border` | Varies: `2px solid var(--color-border)` on `.empty-state`; `none` on inline `.prose img`; `1px solid var(--color-border)` on a solitary breakout `.prose img` | Border around cards/images |

There's no spacing scale (no `--space-*` tokens) — each component's own scoped `<style>` picks
plain rem values directly.

## Class reference

| Class | Purpose | Where it's styled |
|---|---|---|
| `.site-title` | Homepage masthead — the site name as `<h1>`. Also matches `h1.siteTitle`/`.siteTitle` (both spellings targeted at once) | `base.css` |
| `.crumbs`, `.separator`, `.current` | Breadcrumb row — styled as a large uppercase heading-like row, not a muted small line | `base.css` (colors/type) + `Breadcrumbs.astro` (layout: flex-wrap, gap) |
| `.world-dashboard`, `.sidebar-column` | Two-column homepage/world-index layout (Recent Posts main column, Browse + Tags sidebar on desktop; stacks single-column under 900px) | `base.css`, mirrored in `WorldIndex.astro`'s own `<style>` |
| `.panel`, `.panel-title` | One grouped block of content (rendered generically by `ContentPanel.astro` now — see below) | `base.css` (colors/type) + `ContentPanel.astro`/`TagCloud.astro` (layout) |
| `.entry-list`, `.entry`, `.entry-title` | A list of linked items inside a panel (or a full-page listing, e.g. `worlds/index.astro`) | `base.css` (colors/type) + `ContentPanel.astro` (layout) |
| `.meta` | Secondary line under a title (author, date) | `base.css` |
| `.avatar` | Small square (by default) author portrait, 24px | `base.css`. **Note:** `.avatar-lg` (a larger variant) is referenced in the author archive page but no longer defined anywhere — see "Known gaps" |
| `.tag-container`, `.tag-item`, `.tag-name`, `.tag-count` | Tag cloud pills (replaces the old `.tag`/`.tag-cloud`/`.tag-count` names) | `base.css` + `TagCloud.astro`'s own `<style>` (both define overlapping rules — the component's scoped rules win within it) |
| `.pagination`, `.pagination-status`, `.disabled` | Prev/status/next row, now also has a dedicated `Pagination.astro` component (not yet used everywhere — the author archive page still hand-rolls its own `nav.pagination` markup) | `base.css` (colors/type) + `Pagination.astro` (grid layout) where used |
| `.empty-state` | Muted "nothing here yet" message, now a bordered/backgrounded card rather than plain italic text | `base.css` |
| `.article-header`, `.article-title` | Single-post page's title block (distinct from `.panel-title`/generic `h1`) | `base.css`, in `[slug]/index.astro` |
| `.tag-label`, `.post-tag`, `.tag-sep` | The post page's own "Tags: a, b, c" line | `base.css`, in `[slug]/index.astro` |
| `.prose` | Post body wrapper — now includes a drop-cap on the first paragraph, justified text, styled blockquotes/tables, and a "breakout" rule that lets a lone image span full-bleed width | `base.css` |

## Shared components

- **`ContentPanel.astro`** — generic `{title, items[]}` renderer for any "list of linked things
  with optional author/date/section metadata" panel. Replaces the previously-separate
  `BlogFeed.astro`, `BlogsAtLevel.astro`, `BlogsInSection.astro`, `ChildSections.astro`, and
  `RecentPosts.astro` (all now deleted) with one component driven by a plain `Item[]` array each
  caller builds from its own data.
- **`Breadcrumbs.astro`** — `{siteName, crumbs[], currentLabel?}`, replacing the inline
  `<nav class="crumbs">...</nav>` markup previously duplicated in every page file.
- **`Pagination.astro`** — `{prevUrl, nextUrl, pageNum, totalPages}`, replacing inline
  `<nav class="pagination">` markup. Adopted in the blog archive and tag archive pages; the
  author archive page has not been switched over yet and still has its own inline version.

## Known gaps (as of this rewrite)

- **`themes/parchment.css` (repo root) is stale.** It still sets `--fg`/`--bg`/`--muted`/
  `--accent`/`--border` — the variable names from before this rewrite. None of those are read by
  `base.css` anymore, so selecting that theme currently has no visible effect. A working theme
  now needs to target the `--color-*` names in the table above instead.
- **`.avatar-lg`** is used on the author archive page (`src/pages/[world]/authors/[author]/[...page].astro`)
  but has no matching rule anywhere in `base.css` — the large author-page avatar renders at the
  same small size as everywhere else.
- **`.site`** (the `<main class="site">` wrapper in `Layout.astro`) is no longer styled anywhere
  — page-width/margins now come from `body`'s own padding in `base.css` instead.
