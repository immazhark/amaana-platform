import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const source = new URL("../docs/AMAANA_MASTER_RECONCILED_EXECUTION_PLAN.md", import.meta.url);
const types = ["Defect", "Observation", "Enhancement", "Innovation", "Operation"];
const states = ["Implemented", "Partial", "Not started", "Superseded", "Not applicable"];

/** Count canonical rows only; narrative checkpoints and historic aliases do
 * not count as newly completed work. No database, provider or GitHub calls. */
export function summarizeMasterRoadmap(markdown) {
  const byType = Object.fromEntries(types.map(type => [type, 0]));
  const byImplementation = Object.fromEntries(states.map(state => [state, 0]));
  const byCategory = Object.fromEntries(types.map(type => [type, Object.fromEntries(states.map(state => [state, 0]))]));
  const seen = new Set();

  for (const line of markdown.split(/\r?\n/)) {
    if (!/^\|\s*AF-[A-Z0-9-]+\s*\|/.test(line)) continue;
    const columns = line.split("|").map(value => value.trim());
    const [, id, type, , , , , status] = columns;
    if (seen.has(id)) throw new Error(`Duplicate canonical roadmap item: ${id}`);
    if (!types.includes(type)) throw new Error(`Unrecognized roadmap category for ${id}: ${type}`);
    const state = status?.match(/(?:^|;\s*)I=(Implemented|Partial|Not started|Superseded|Not applicable)(?:;|$)/)?.[1];
    if (!state) throw new Error(`Missing or invalid implementation state for ${id}`);
    seen.add(id);
    byType[type]++;
    byImplementation[state]++;
    byCategory[type][state]++;
  }
  if (seen.size === 0) throw new Error("No canonical roadmap entries found");
  return { total: seen.size, byType, byImplementation, byCategory };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const summary = summarizeMasterRoadmap(readFileSync(source, "utf8"));
  if (process.argv.includes("--json")) console.log(JSON.stringify(summary, null, 2));
  else {
    console.log(`Amaana master roadmap: ${summary.total} canonical items (source classification, not release acceptance)`);
    for (const type of types) {
      const parts = states.filter(state => summary.byCategory[type][state])
        .map(state => `${state}: ${summary.byCategory[type][state]}`);
      console.log(`${type}: ${summary.byType[type]} — ${parts.join(", ")}`);
    }
    console.log("Items marked Implemented may still be untested, unmerged or not deployed.");
  }
}
