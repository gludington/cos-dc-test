import { defineConfig } from "astro/config";

// Minimal config: static output only, no integrations yet. Pagefind search
// and the eventual GM-vs-player build split (CLAUDE.md open question 4)
// are later additions, not part of this scaffold.
export default defineConfig({
  output: "static",
});
