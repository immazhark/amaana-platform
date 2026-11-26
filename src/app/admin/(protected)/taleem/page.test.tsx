import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requirePermission: vi.fn(), loadRoster: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: mocks.requirePermission }));
vi.mock("@/lib/taleem-roster-service", () => ({ loadRoster: mocks.loadRoster }));
vi.mock("./actions", () => {
  const noop = async () => undefined;
  return { assignLearnerAction: noop, confirmHifdhEvidenceAction: noop, createLearnerAction: noop, createPlaceAction: noop, endAssignmentAction: noop, recordHifdhCompletionAction: noop, setLearnerStatusAction: noop, setPlaceStatusAction: noop, startEnrolmentAction: noop };
});

import TaleemRosterPage from "./page";

const counts = (over: Record<string, number> = {}) => ({
  asOf: "2026-11-22", maintainedPlaces: 26, occupiedPlaces: 25, vacantPlaces: 1, currentlySupportedStudents: 25,
  studentsSupportedSinceInception: 31, hifdhCompletionsInYear: 4, hifdhCompletionsAllTime: 6, ...over,
});
const render = async (roster: unknown, notice?: string) => {
  mocks.loadRoster.mockResolvedValue(roster);
  return renderToStaticMarkup(await TaleemRosterPage({ searchParams: Promise.resolve({ notice }) }));
};

beforeEach(() => { vi.clearAllMocks(); mocks.requirePermission.mockResolvedValue({ id: "u" }); });

describe("Taleem roster admin page", () => {
  it("requires the approver permission before loading anything", async () => {
    mocks.requirePermission.mockRejectedValue(new Error("Synthetic redirect: /admin/forbidden"));
    await expect(render({ counts: counts(), learners: [], places: [] })).rejects.toThrow("/admin/forbidden");
    expect(mocks.requirePermission).toHaveBeenCalledWith("assistance.approve");
    expect(mocks.loadRoster).not.toHaveBeenCalled();
  });

  it("shows each count as its own labelled figure and never one combined number", async () => {
    const html = await render({ counts: counts(), learners: [], places: [] });
    for (const label of ["Places maintained in these records", "Places with a learner today", "Vacant maintained places", "Currently supported students", "Students supported since inception", "Verified Hifdh completions this year", "Verified Hifdh completions, all time"]) expect(html).toContain(label);
    expect(html).toContain("Do not add them together");
  });

  it("compares the published student baseline to matched Nazira / Hifdh learners, never to the place count", async () => {
    const learners = Array.from({ length: 26 }, (_, index) => ({ id: `l${index}`, publicAlias: `TL-SYNTH${index}`, fullName: "Synthetic Person", status: "ACTIVE", programme: "NAZIRA", placeCode: `TP-SYNTH${index}`, assignmentId: null, openAssignmentPlaceCode: null, openAssignmentStartsOn: null, hasBlockingAssignment: true, completedHifdhOn: null, completionReview: null }));
    const places = learners.map((learner, index) => ({ id: `p${index}`, placeCode: learner.placeCode, status: "MAINTAINED", holderAlias: learner.publicAlias, assignmentId: null, hasBlockingAssignment: true }));
    const html = await render({ counts: counts({ occupiedPlaces: 26, vacantPlaces: 0, currentlySupportedStudents: 26 }), learners, places });
    expect(html).toContain("Published student baseline</dt><dd>26");
    expect(html).toContain("numerical match only; confirm the underlying records");
    const missing = await render({ counts: counts(), learners: learners.slice(0, 25), places });
    expect(missing).toContain("differs from the dated student baseline");
    expect(await render({ counts: counts({ maintainedPlaces: 0, occupiedPlaces: 0, vacantPlaces: 0 }), learners: [], places: [] })).toContain("no places entered yet");
  });

  it("lists learners with their opaque reference, programme and place, and a vacant place as assignable", async () => {
    const html = await render({
      counts: counts(),
      learners: [{ id: "l1", publicAlias: "TL-ABCDEFGH", fullName: "Synthetic Person", status: "ACTIVE", programme: "NAZIRA", placeCode: null, assignmentId: null, openAssignmentPlaceCode: null, openAssignmentStartsOn: null, hasBlockingAssignment: false, completedHifdhOn: null }],
      places: [{ id: "p1", placeCode: "TP-ABCDEF", status: "MAINTAINED", holderAlias: null, assignmentId: null, hasBlockingAssignment: false }],
    });
    expect(html).toContain("TL-ABCDEFGH");
    expect(html).toContain("Nazira");
    expect(html).toContain("No place");
    expect(html).toContain("Vacant place");
    expect(html).toContain("TP-ABCDEF");
  });

  it("offers to end the current assignment, not to assign again, for a learner who holds a place", async () => {
    const html = await render({
      counts: counts(),
      learners: [{ id: "l1", publicAlias: "TL-ABCDEFGH", fullName: "Synthetic Person", status: "ACTIVE", programme: "HIFDH", placeCode: "TP-ABCDEF", assignmentId: "a1", openAssignmentPlaceCode: "TP-ABCDEF", openAssignmentStartsOn: "2026-01-01", hasBlockingAssignment: true, completedHifdhOn: null }],
      places: [{ id: "p1", placeCode: "TP-ABCDEF", status: "MAINTAINED", holderAlias: "TL-ABCDEFGH", assignmentId: "a1", hasBlockingAssignment: true }],
    });
    expect(html).toContain("End this assignment");
    expect(html).not.toContain("Assign this place");
  });

  it("never offers a place to a learner who has left, and hides the completion form once one is recorded", async () => {
    const html = await render({
      counts: counts(),
      learners: [{ id: "l1", publicAlias: "TL-ABCDEFGH", fullName: "Synthetic Person", status: "LEFT", programme: null, placeCode: null, assignmentId: null, openAssignmentPlaceCode: null, openAssignmentStartsOn: null, hasBlockingAssignment: false, completedHifdhOn: "2026-06-15" }],
      places: [{ id: "p1", placeCode: "TP-ABCDEF", status: "MAINTAINED", holderAlias: null, assignmentId: null, hasBlockingAssignment: false }],
    });
    expect(html).not.toContain("Assign this place");
    expect(html).not.toContain("Record Hifdh completion");
    expect(html).toContain("Hifdh completion recorded 2026-06-15");
  });

  it("distinguishes scheduled and current assignments, and does not offer a reserved place to a different learner", async () => {
    const html = await render({
      counts: counts(),
      learners: [
        { id: "l1", publicAlias: "TL-ABCDEFGH", fullName: "Synthetic Future Holder", status: "ACTIVE", programme: "QAIDA", placeCode: null, assignmentId: "future", openAssignmentPlaceCode: "TP-ABCDEF", openAssignmentStartsOn: "2026-11-27", hasBlockingAssignment: true, completedHifdhOn: null },
        { id: "l2", publicAlias: "TL-BCDEFGHJ", fullName: "Synthetic Other Learner", status: "ACTIVE", programme: "QAIDA", placeCode: null, assignmentId: null, openAssignmentPlaceCode: null, openAssignmentStartsOn: null, hasBlockingAssignment: false, completedHifdhOn: null },
      ],
      places: [{ id: "p1", placeCode: "TP-ABCDEF", status: "MAINTAINED", holderAlias: null, assignmentId: "future", hasBlockingAssignment: true }],
    });
    expect(html).toContain("Vacant today — future assignment recorded");
    expect(html).toContain("Scheduled from 2026-11-27: TP-ABCDEF");
    expect(html).toContain("End open assignment for TP-ABCDEF on");
    expect(html).not.toContain("Assign this place");
  });

  it("makes the scrollable places table a labelled, keyboard-focusable region", async () => {
    const html = await render({ counts: counts(), learners: [], places: [{ id: "p1", placeCode: "TP-ABCDEF", status: "MAINTAINED", holderAlias: null, assignmentId: null, hasBlockingAssignment: false }] });
    expect(html).toMatch(/<div class="admin-table-wrap" tabindex="0" role="region" aria-label="Sponsored places and who holds each today">/);
  });

  it("labels every form control", async () => {
    const html = await render({
      counts: counts(),
      learners: [{ id: "l1", publicAlias: "TL-ABCDEFGH", fullName: "Synthetic Person", status: "ACTIVE", programme: "QAIDA", placeCode: null, assignmentId: null, openAssignmentPlaceCode: null, openAssignmentStartsOn: null, hasBlockingAssignment: false, completedHifdhOn: null }],
      places: [{ id: "p1", placeCode: "TP-ABCDEF", status: "MAINTAINED", holderAlias: null, assignmentId: null, hasBlockingAssignment: false }],
    });
    const controls = [...html.matchAll(/<(?:input|select|textarea)\b[^>]*>/g)].map(match => match[0]).filter(tag => !/type="hidden"/.test(tag));
    expect(controls.length).toBeGreaterThan(8);
    for (const tag of controls) {
      const id = /\bid="([^"]+)"/.exec(tag)?.[1];
      expect(id, tag).toBeTruthy();
      expect(html, tag).toContain(`for="${id}"`);
    }
  });

  it("shows a notice from an action, truncated", async () => {
    expect(await render({ counts: counts(), learners: [], places: [] }, "Place assigned.")).toContain("Place assigned.");
    expect(await render({ counts: counts(), learners: [], places: [] }, "x".repeat(500))).not.toContain("x".repeat(201));
  });
});

it("offers follow-up confirmation only for unresolved evidence on a recorded, nonfuture milestone", async () => {
  const learner = { id: "l1", publicAlias: "TL-ABCDEFGH", fullName: "Synthetic Person", status: "GRADUATED", programme: "HIFDH", placeCode: null, assignmentId: null, openAssignmentPlaceCode: null, openAssignmentStartsOn: null, hasBlockingAssignment: false, completedHifdhOn: "2026-06-15", completionReview: { verified: false, supportAssociated: true } };
  const html = await render({ counts: counts(), learners: [learner], places: [] });
  expect(html).toContain("Confirm selected Hifdh evidence");
  expect(html).toContain('name="verified"');
  expect(html).not.toContain('name="supportAssociated"');
  expect(html).toContain("Amaana support association confirmed");
  expect(html).toContain('href="#learner-TL-ABCDEFGH"');
  expect(html).toContain("This does not publish a new figure or end support.");
  const complete = await render({ counts: counts(), learners: [{ ...learner, completionReview: { verified: true, supportAssociated: true } }], places: [] });
  expect(complete).not.toContain("Confirm selected Hifdh evidence");
  const future = await render({ counts: counts(), learners: [{ ...learner, completedHifdhOn: "2026-11-23" }], places: [] });
  expect(future).not.toContain("Confirm selected Hifdh evidence");
});
