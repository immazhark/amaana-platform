import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const wrapper = '// Generated synthetic media acceptance route. Do not edit.\nimport { GET as serve } from "@/app/browser-acceptance/managed-image-source/handler";\nexport const dynamic = "force-dynamic";\nexport const GET = serve;\n';
const names = Array.from({ length: 4 }, (_, i) => `00000000-0000-4000-8000-00000000000${i + 1}.jpg`);

export async function materializeManagedImageAcceptance(root, enabled) {
  const routes = names.map(name => path.join(root, "src", "app", "media", "2099", name, "route.ts"));
  // Refuse collisions before writing or removing any reserved fixture route.
  for (const route of routes) {
    const previous = await readFile(route, "utf8").catch(error => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (previous !== null && previous !== wrapper) throw new Error("Unexpected file in reserved synthetic media route");
  }
  for (const route of routes) {
    if (!enabled) { await rm(route, { force: true }); continue; }
    await mkdir(path.dirname(route), { recursive: true });
    await writeFile(route, wrapper);
  }
  if (!enabled) return;
  const target = path.join(root, "src", "app", "browser-acceptance", "managed-image-source", "handler.ts");
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(path.join(root, "e2e", "fixtures", "browser-acceptance", "managed-image-source", "route.ts.fixture"), target);
}
