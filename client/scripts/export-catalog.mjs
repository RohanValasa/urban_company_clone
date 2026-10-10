// Writes the service catalogue the server's AI assistant chooses from:
// server/src/data/catalog.json. Run `npm run catalog` after changing
// src/data/services.js (a server test fails while the two disagree).
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "../server/src/data/catalog.json");

// services.js uses Vite-only imports (the emoji art), so load it through Vite.
const vite = await createServer({ root, logLevel: "error", server: { middlewareMode: true }, appType: "custom" });
try {
  const { SUBCATEGORIES } = await vite.ssrLoadModule("/src/data/services.js");
  const catalog = Object.values(SUBCATEGORIES).map((sub) => ({
    slug: sub.slug,
    label: sub.label,
    packages: sub.packages.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      mrp: p.mrp,
      duration: p.duration || "",
      kind: sub.tabs.find((t) => t.id === p.tab)?.label || "",
    })),
  }));
  writeFileSync(out, JSON.stringify(catalog, null, 1) + "\n");
  const count = catalog.reduce((n, s) => n + s.packages.length, 0);
  console.log(`Wrote ${catalog.length} services and ${count} packages to ${out}`);
} finally {
  await vite.close();
}
