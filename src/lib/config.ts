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
// Anchored on process.cwd(), not import.meta.url -- Astro's build bundles
// this module into a relocated chunk file (dist/.prerender/chunks/...), so
// import.meta.url doesn't reflect this file's real source location at
// build time. process.cwd() is reliably the project root Astro always
// builds from (confirmed against a real `astro build` run).
const CONFIG_PATH = path.join(process.cwd(), "content", "site-config.json");

export interface SiteConfig {
  theme: string;
}

export function getSiteConfig(): SiteConfig {
  if (!existsSync(CONFIG_PATH)) return { theme: "default" };
  try {
    const raw = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
    const theme = typeof raw.theme === "string" && raw.theme.trim() ? raw.theme.trim() : "default";
    return { theme };
  } catch {
    return { theme: "default" };
  }
}

const THEMES_BASE_URL = "https://wikiworld-themes.pages.dev/themes";

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
