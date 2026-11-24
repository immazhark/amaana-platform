import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const HEADER = "id,priority,workstream,scope,historical_classification,current_classification,acceptance_evidence,next_action,reverified_2026_11_15,review_note,acceptance_blocker,execution_lane,next_unblocked_milestone,blocker_report";
const STATUSES = ["Completed", "Implemented", "Partial", "Not started", "Superseded", "Not applicable"];
const ACTIVE = new Set(["Implemented", "Partial", "Not started"]);

// The canonical register uses one physical line per row. Reject malformed or
// multiline records instead of silently changing the established format.
function parseRow(line) {
  const fields = [];
  let index = 0;
  while (true) {
    let value = "";
    if (line[index] === '"') {
      index++;
      let closed = false;
      while (index < line.length) {
        if (line[index] !== '"') value += line[index++];
        else if (line[index + 1] === '"') { value += '"'; index += 2; }
        else { index++; closed = true; break; }
      }
      if (!closed || (index < line.length && line[index] !== ",")) throw new Error("Canonical malformed CSV row");
    } else {
      while (index < line.length && line[index] !== ",") {
        if (line[index] === '"') throw new Error("Canonical malformed CSV row");
        value += line[index++];
      }
    }
    fields.push(value);
    if (index === line.length) return fields;
    index++;
  }
}

function linesOf(csv, label) {
  if (typeof csv !== "string") throw new Error(`${label} must be CSV text`);
  const lines = csv.replaceAll("\r\n", "\n").replace(/\n$/, "").split("\n");
  if (lines.shift() !== HEADER || lines.some(line => !line || line.includes("\r"))) throw new Error(`${label} has invalid header or row format`);
  return lines;
}

export function verifyBacklogQueue(canonical, queue) {
  const lines = linesOf(canonical, "Canonical register");
  if (lines.length !== 149) throw new Error("Canonical register must have 149 rows");
  const counts = Object.fromEntries(STATUSES.map(status => [status, 0]));
  const ids = new Set();
  const expected = [];
  for (const line of lines) {
    const fields = parseRow(line);
    const [id, , , , historical, current] = fields;
    if (fields.length !== 14 || !/^AF-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(id) || ids.has(id) || !STATUSES.includes(historical) || !STATUSES.includes(current)) throw new Error("Canonical register has invalid or duplicate ID, classification or field count");
    ids.add(id);
    counts[current]++;
    if (ACTIVE.has(current)) expected.push(line);
  }
  const actual = linesOf(queue, "Active queue");
  if (actual.length !== expected.length || actual.some((line, i) => line !== expected[i])) throw new Error(`Active queue differs from canonical active rows (expected ${expected.length}, observed ${actual.length})`);
  return { total: lines.length, actionable: expected.length, counts };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const base = new URL("../docs/mission-control/", import.meta.url);
  try {
    const canonical = readFileSync(new URL("149-item-status-2026-11-15.csv", base), "utf8");
    const queue = readFileSync(new URL("active-backlog-2026-11-15.csv", base), "utf8");
    console.log(JSON.stringify(verifyBacklogQueue(canonical, queue), null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Backlog validation failed");
    process.exitCode = 1;
  }
}
