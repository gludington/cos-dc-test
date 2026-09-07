import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";

// Resolved here, at config-parse time, rather than in src/lib/config.ts at
// runtime: this file's own import.meta.url is reliable, but a runtime
// module's import.meta.url is NOT once Astro bundles it into a relocated
// build chunk (dist/.prerender/chunks/...), and process.cwd() isn't
// reliable either -- it's wherever the build command happened to be
// invoked from (`cd site && npm run build` vs. running from the repo root
// give different answers), not fixed to this project's root. Baking the
// absolute path in via Vite's `define` sidesteps both problems.
const CONTENT_DIR = fileURLToPath(new URL("../content", import.meta.url));

// Minimal config: static output only, no integrations yet. Pagefind search
// and the eventual GM-vs-player build split (CLAUDE.md open question 4)
// are later additions, not part of this scaffold.
export default defineConfig({
  output: "static",
  vite: {
    define: {
      __WIKIWORLD_CONTENT_DIR__: JSON.stringify(CONTENT_DIR),
    },
  },
});
