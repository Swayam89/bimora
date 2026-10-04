// Copies the self-hosted variable fonts from node_modules into public/fonts at build time,
// so no binary files need to live in the repo and fonts can be preloaded.
import { mkdirSync, copyFileSync } from "node:fs";
const files = [
  ["@fontsource-variable/inter/files/inter-latin-wght-normal.woff2", "inter-latin.woff2"],
  ["@fontsource-variable/inter/files/inter-latin-ext-wght-normal.woff2", "inter-latin-ext.woff2"],
  ["@fontsource-variable/newsreader/files/newsreader-latin-wght-normal.woff2", "newsreader-latin.woff2"],
  ["@fontsource-variable/newsreader/files/newsreader-latin-ext-wght-normal.woff2", "newsreader-latin-ext.woff2"],
];
mkdirSync("public/fonts", { recursive: true });
for (const [from, to] of files) copyFileSync(`node_modules/${from}`, `public/fonts/${to}`);
console.log("fonts copied");
