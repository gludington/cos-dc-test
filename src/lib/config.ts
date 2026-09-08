import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// content/site-config.json is pushed by the Foundry module's
// publishToGitHub() alongside post markdown (see render.js's
// buildSiteConfigFile) -- read directly here rather than through the
// content-collections API, since it's a single site-wide value, not a
// collection of entries. This is the mechanism that lets a site-wide
// setting (chosen once, in Foundry) reach an already-deployed site without
// any git action: it rides the same publish button that's already pushing
// posts, not a separate step.
//
// __WORLD2WEB_CONTENT_DIR__ is injected by astro.config.mjs via Vite's
// `define` -- neither process.cwd() (depends on the invoking shell's
// working directory when the build command runs, not this project's root)
// nor this module's own import.meta.url (Astro relocates this into a build
// chunk under dist/.prerender/chunks/, losing its real source location) is
// reliable here. See astro.config.mjs for why its own import.meta.url is.
declare const __WORLD2WEB_CONTENT_DIR__: string;
const CONFIG_PATH = path.join(__WORLD2WEB_CONTENT_DIR__, "site-config.json");

const DEFAULT_SITE_NAME = "World2Web";
const DEFAULT_BLOGS_SEGMENT = "journals";

/** The configured URL segment name gets slugified here, once, regardless
 * of what the GM actually typed into the Foundry setting -- unlike
 * siteName/theme (plain text, never embedded in a URL), this one becomes a
 * literal path segment on every blog/post URL, so it has to be URL-safe no
 * matter what. */
function slugifySegment(value: string, fallback: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

export interface SiteConfig {
  theme: string;
  siteName: string;
  blogsSegment: string;
}

export function getSiteConfig(): SiteConfig {
  if (!existsSync(CONFIG_PATH)) {
    return { theme: "default", siteName: DEFAULT_SITE_NAME, blogsSegment: DEFAULT_BLOGS_SEGMENT };
  }
  try {
    const raw = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
    const theme = typeof raw.theme === "string" && raw.theme.trim() ? raw.theme.trim() : "default";
    const siteName = typeof raw.siteName === "string" && raw.siteName.trim() ? raw.siteName.trim() : DEFAULT_SITE_NAME;
    const blogsSegment =
      typeof raw.blogsSegment === "string" && raw.blogsSegment.trim()
        ? slugifySegment(raw.blogsSegment, DEFAULT_BLOGS_SEGMENT)
        : DEFAULT_BLOGS_SEGMENT;
    return { theme, siteName, blogsSegment };
  } catch {
    return { theme: "default", siteName: DEFAULT_SITE_NAME, blogsSegment: DEFAULT_BLOGS_SEGMENT };
  }
}

const THEMES_BASE_URL = "https://world2web-themes.pages.dev/themes";

/** null means "no external stylesheet at all -- use the site's built-in
 * look" (the "default" case, and the safe fallback for anything unset).
 * A theme value that's already a full URL is used as-is, for anyone who'd
 * rather host their own custom CSS than pick from the shared collection --
 * same publish mechanism either way, no code difference between "named
 * theme" and "custom URL" beyond this one check.
 *
 * Whatever hosts a custom URL's CSS must serve it with a real `text/css`
 * Content-Type. raw.githubusercontent.com does NOT (sends text/plain with
 * X-Content-Type-Options: nosniff), which makes browsers silently refuse to
 * apply it as a stylesheet at all -- confirmed live. jsDelivr's GitHub
 * proxy (cdn.jsdelivr.net/gh/<owner>/<repo>@<branch>/<path>) serves the
 * same file with the correct MIME type. */
export function resolveThemeUrl(theme: string): string | null {
  if (!theme || theme === "default") return null;
  if (/^https?:\/\//i.test(theme)) return theme;
  return `${THEMES_BASE_URL}/${encodeURIComponent(theme)}.css`;
}
