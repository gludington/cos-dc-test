# Design system

Two files:

- **`tokens.css`** — every value a theme can override. Just CSS custom properties on `:root`
  (plus a `prefers-color-scheme: dark` block), nothing else.
- **`base.css`** — the site's actual look: resets, typography, and one class per reusable piece
  of UI. Every value in here is a `var(--...)` from `tokens.css` — nothing is hardcoded outside
  that file, so overriding tokens is enough to reskin the whole site.

Both are imported once, in `layouts/Layout.astro`, and apply site-wide.

## How theming actually works

`layouts/Layout.astro` wraps every rule in `base.css` in `@layer base`. A theme (an external
stylesheet, configured via the Foundry module's site-wide settings → written to
`content/site-config.json` → resolved to a URL by `lib/config.ts`'s `resolveThemeUrl()`) is loaded
as a plain `<link rel="stylesheet">` with **no** `@layer` wrapper. Per the CSS cascade spec, *any*
unlayered rule beats *any* layered one, regardless of selector specificity or where either tag
ends up in the document — so a theme reliably wins over `base.css` no matter what. A theme
generally only needs to redeclare `:root` custom properties (see `themes/parchment.css` in the
repo root for a real, minimal example); it doesn't need to fight `base.css`'s selectors at all.

If you're hosting a custom theme file yourself rather than using one from the shared collection:
it must be served with a real `text/css` Content-Type. `raw.githubusercontent.com` sends
`text/plain` with `X-Content-Type-Options: nosniff`, which makes browsers silently refuse to apply
it — confirmed live. jsDelivr's GitHub proxy (`cdn.jsdelivr.net/gh/<owner>/<repo>@<branch>/<path>`)
serves the same file with the correct MIME type.

## Token reference (`tokens.css`)

### Colors

| Token | Default (light) | Default (dark) | Used for |
|---|---|---|---|
| `--fg` | `#2b1d0f` | `#e9dfc7` | Body text color |
| `--bg` | `#f4ecd8` | `#1b140c` | Page background |
| `--muted` | `#7a5c33` | `#b49a6c` | Secondary text — `.meta`, `.panel-title`, `.crumbs`, `.empty-state`, disabled pagination |
| `--accent` | `#8b5a2b` | `#c9a253` | Links, tag borders |
| `--border` | `#c9a876` | `#4a3a26` | All hairline borders/dividers |
| `--surface` | `#fbf4e2` | `#241a10` | Slightly-raised background — tag pills, blockquotes |
| `--accent-strong` | `#6b3f14` | `#e0b25a` | Link/tag hover color |
| `--shadow-tint` | `30 25% 15%` | `30 60% 1%` | HSL triplet (no `hsl()` wrapper) feeding the body background's vignette gradient — `hsl(var(--shadow-tint) / <alpha>)` |

`--fg`/`--bg`/`--muted`/`--accent`/`--border` are the original five this theming mechanism was
built around — kept stable so any theme written against just those five (including
`themes/parchment.css`) keeps working untouched. Everything else is later, optional surface.

### Typography

| Token | Default | Notes |
|---|---|---|
| `--font-heading` | `"Cinzel", Georgia, "Times New Roman", serif` | `h1`–`h4`, `.panel-title`, `.tag`. Cinzel is loaded from Google Fonts in `Layout.astro`'s `<head>`; the fallbacks are what renders before it loads (or if a theme drops the Google Fonts `<link>` entirely). |
| `--font-body` | `"EB Garamond", Georgia, "Palatino Linotype", "Book Antiqua", serif` | Everything else. Same Google Fonts / fallback relationship as above. |
| `--font-size-base` | `1.0625rem` | `body` font-size |

### Spacing scale

`--space-1` through `--space-6`: `0.25rem, 0.5rem, 1rem, 1.5rem, 2.5rem, 4rem`. Used for every
margin/padding in `base.css` — no bare `rem`/`px` values outside this scale.

### Shape

| Token | Default | Notes |
|---|---|---|
| `--radius-sm` | `4px` | `.prose img`, `.prose blockquote` |
| `--radius-md` | `10px` | Reserved — not yet consumed by `base.css`, available for a theme or a future component that wants a larger radius (e.g. card-style panels) |
| `--border-width` | `1px` | Every hairline border |

## Class reference (`base.css`)

| Class | Purpose | Used in |
|---|---|---|
| `.site` | Page-width wrapper (max-width + padding) | `Layout.astro`'s `<main>` |
| `.site-title` | Homepage masthead: centered, large, uppercase, bottom-bordered, fleuron (❦) below | `pages/index.astro`'s `<h1>` only — every other page's `<h1>` is a page title, not the site name, and gets the plain heading style |
| `.crumbs` | Breadcrumb nav row | Every page except the homepage |
| `.panel` | One grouped block of content (a section of the page — recent posts, a tag cloud, a list of blogs, etc.) | `BlogFeed`, `BlogsAtLevel`, `BlogsInSection`, `ChildSections`, `RecentPosts`, `TagCloud`, the homepage's multi-world picker |
| `.panel-title` | The `<h2>` heading inside a `.panel` | Same components as `.panel` |
| `.entry-list` | Plain (no bullets) list of entries inside a panel or a full-page listing | Every post/blog/world/section listing site-wide |
| `.entry` | One `<li>` in an `.entry-list` — bottom-dotted divider, no divider on the last child | Same |
| `.entry-title` | The primary link/title inside an `.entry` — bold weight | Same |
| `.meta` | Secondary line under a title (author, date, byline) | Everywhere a post/blog is listed or shown |
| `.avatar` | Small circular author portrait, inline with text | `.meta` rows |
| `.avatar-lg` | Larger, block-level version of `.avatar` | Author archive page header |
| `.tag` | Pill-shaped tag badge (also reused as the plain "Tag" kicker label above a tag archive page's `<h1>`) | `TagCloud`, tag archive page |
| `.tag-cloud` | Flex-wrap container for a group of `.tag` pills | `TagCloud` |
| `.tag-count` | Small muted post-count suffix inside a tag pill | `TagCloud` |
| `.pagination` | Prev/status/next row | Blog archive, author archive, tag archive pages |
| `.pagination-status` | The "Page X of Y" label in `.pagination` | Same |
| `.disabled` | Grayed-out, non-link prev/next label in `.pagination` when there's no adjacent page | Same |
| `.empty-state` | Muted, italic "nothing here yet" message | `WorldIndex`, `worlds/index.astro`, section pages with no content |
| `.prose` | Wraps a post's rendered body (raw HTML passthrough from Foundry's ProseMirror editor) — headings, paragraphs, lists, blockquotes, images, tables, `<hr>` | The single-post page only |

Every selector in `base.css` other than the handful of plain-element resets (`*`, `html`, `body`,
`h1`–`h4`, `a`, `code`) uses `:where(...)` to keep specificity at zero, so an inline override or a
more specific theme rule never needs `!important` to win.

## Swapping the fonts

The two Google Fonts requests (Cinzel + EB Garamond) in `Layout.astro`'s `<head>` are the only
network dependency this design system adds. To go fully offline/no-network instead: delete the
`<link rel="preconnect">`/`<link rel="stylesheet" href="https://fonts.googleapis.com/...">` lines
in `Layout.astro`, and the `--font-heading`/`--font-body` fallback stacks in `tokens.css` (already
system fonts) take over as the actual look.
