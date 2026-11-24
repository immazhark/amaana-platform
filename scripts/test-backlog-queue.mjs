import assert from "node:assert/strict";
import test from "node:test";
import { verifyBacklogQueue } from "./check-backlog-queue.mjs";

const header = "id,priority,workstream,scope,historical_classification,current_classification,acceptance_evidence,next_action,reverified_2026_11_15,review_note,acceptance_blocker,execution_lane,next_unblocked_milestone,blocker_report";
const row = (i, status = "Completed", evidence = '"Verified, with ""quotes"""') => [
  `AF-R${String(i).padStart(3, "0")}`, "P1", "W1", "Scope", "Partial", status, evidence,
  "Next", "VERIFIED", "Note", "", "ENGINEERING", "", "",
].join(",");
const csv = rows => [header, ...rows].join("\n") + "\n";
const rows = Array.from({ length: 149 }, (_, i) => row(i + 1, i < 2 ? "Partial" : i === 2 ? "Implemented" : i === 3 ? "Not started" : i === 4 ? "Not applicable" : i === 5 ? "Superseded" : "Completed"));
const queue = rows.slice(0, 4);

test("exact derived queue preserves all active rows, quoted evidence and canonical order", () => {
  assert.deepEqual(verifyBacklogQueue(csv(rows), csv(queue)), {
    total: 149, actionable: 4, counts: { Completed: 143, Implemented: 1, Partial: 2, "Not started": 1, Superseded: 1, "Not applicable": 1 },
  });
  assert.equal(verifyBacklogQueue(csv(rows).replaceAll("\n", "\r\n"), csv(queue)).actionable, 4);
});

test("stale, missing, reordered, duplicated, or altered active rows fail closed", () => {
  for (const bad of [[...queue, rows[6]], queue.slice(1), [queue[1], queue[0], ...queue.slice(2)], [...queue, queue[0]], [queue[0].replace("Scope", "Changed"), ...queue.slice(1)]]) {
    assert.throws(() => verifyBacklogQueue(csv(rows), csv(bad)), /Active queue/);
  }
});

test("invalid canonical count, duplicate IDs, unknown status, malformed CSV and mismatched header fail closed", () => {
  for (const bad of [rows.slice(1), [rows[0], rows[0], ...rows.slice(2)], [row(1, "Unknown"), ...rows.slice(1)], [row(1, "Partial", '"unclosed'), ...rows.slice(1)]]) {
    assert.throws(() => verifyBacklogQueue(csv(bad), csv(queue)), /Canonical/);
  }
  assert.throws(() => verifyBacklogQueue(csv(rows), csv(queue).replace("priority", "wrong")), /Active queue/);
});
