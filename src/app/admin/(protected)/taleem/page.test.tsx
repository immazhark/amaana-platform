import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requirePermission: vi.fn(), loadRoster: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: mocks.requirePermission }));
vi.mock("@/lib/taleem-roster-service", () => ({ loadRoster: mocks.loadRoster }));
vi.mock("./actions", () => {
  const noop = async () => undefined;
  return { assignLearnerAction: noop, createLearnerAction: noop, createPlaceAction: noop, endAssignmentAction: noop, recordHifdhCompletionAction: noop, setLearnerStatusAction: noop, setPlaceStatusAction: noop, startEnrolmentAction: noop };
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

  it("states the published baseline and stays quiet when the records agree with it", async () => {
    const html = await render({ counts: counts(), learners: [], places: [] });
    expect(html).toContain("published baseline: 26");
    expect(html).not.toContain("differs from the published baseline");
  });

  it("says plainly when the records differ from the published baseline, or hold no places yet", async () => {
    expect(await render({ counts: counts({ maintainedPlaces: 24, occupiedPlaces: 24, vacantPlaces: 0 }), learners: [], places: [] })).toContain("differs from the published baseline; reconcile before publishing anything");
    expect(await render({ counts: counts({ maintainedPlaces: 0, occupiedPlaces: 0, vacantPlaces: 0 }), learners: [], places: [] })).toContain("no places entered yet");
  });

  it("lists learners with their opaque reference, programme and place, and a vacant place as assignable", async () => {
    const html = await render({
      counts: counts(),
      learners: [{ id: "l1", publicAlias: "TL-ABCDEFGH", fullName: "Synthetic Person", status: "ACTIVE", programme: "NAZIRA", placeCode: null, assignmentId: null, completedHifdhOn: null }],
      places: [{ id: "p1", placeCode: "TP-ABCDEF", status: "MAINTAINED", holderAlias: null, assignmentId: null }],
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
      learners: [{ id: "l1", publicAlias: "TL-ABCDEFGH", fullName: "Synthetic Person", status: "ACTIVE", programme: "HIFDH", placeCode: "TP-ABCDEF", assignmentId: "a1", completedHifdhOn: null }],
      places: [{ id: "p1", placeCode: "TP-ABCDEF", status: "MAINTAINED", holderAlias: "TL-ABCDEFGH", assignmentId: "a1" }],
    });
    expect(html).toContain("End this assignment");
    expect(html).not.toContain("Assign this place");
  });

  it("never offers a place to a learner who has left, and hides the completion form once one is recorded", async () => {
    const html = await render({
      counts: counts(),
      learners: [{ id: "l1", publicAlias: "TL-ABCDEFGH", fullName: "Synthetic Person", status: "LEFT", programme: null, placeCode: null, assignmentId: null, completedHifdhOn: "2026-06-15" }],
      places: [{ id: "p1", placeCode: "TP-ABCDEF", status: "MAINTAINED", holderAlias: null, assignmentId: null }],
    });
    expect(html).not.toContain("Assign this place");
    expect(html).not.toContain("Record Hifdh completion");
    expect(html).toContain("Hifdh completed 2026-06-15");
  });

  it("labels every form control", async () => {
    const html = await render({
      counts: counts(),
      learners: [{ id: "l1", publicAlias: "TL-ABCDEFGH", fullName: "Synthetic Person", status: "ACTIVE", programme: "QAIDA", placeCode: null, assignmentId: null, completedHifdhOn: null }],
      places: [{ id: "p1", placeCode: "TP-ABCDEF", status: "MAINTAINED", holderAlias: null, assignmentId: null }],
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
