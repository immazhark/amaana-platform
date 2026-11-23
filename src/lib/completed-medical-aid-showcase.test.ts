import { describe, expect, it } from "vitest";
import { selectCompletedMedicalAidShowcase } from "./completed-medical-aid-showcase";

const records = [
  { slug: "medical-completed", causeSlug: "medical-financial-relief", programmeStatus: "COMPLETED", title: "Completed case" },
  { slug: "medical-ongoing", causeSlug: "medical-financial-relief", programmeStatus: "ONGOING", title: "Continuing help" },
  { slug: "medical-draft", causeSlug: "medical-financial-relief", programmeStatus: "COMPLETED", title: "Not published" },
  { slug: "medical-unknown", causeSlug: "medical-financial-relief", title: "Status unknown" },
  { slug: "other-completed", causeSlug: "seasonal-relief", programmeStatus: "COMPLETED", title: "Other initiative" },
];

describe("completed medical assistance showcase", () => {
  it("requires both completed canonical status and an independently published record", () => {
    expect(selectCompletedMedicalAidShowcase(records, new Set(["medical-completed", "medical-ongoing", "medical-unknown", "other-completed"])).map(p => p.slug))
      .toEqual(["medical-completed"]);
  });

  it("does not present ongoing medical assistance as a completed case even with approved media", () => {
    expect(selectCompletedMedicalAidShowcase(records, new Set(["medical-ongoing"]))).toEqual([]);
  });

  it("fails closed on unknown or missing programme status and preserves source ordering", () => {
    const duplicate = { slug: "medical-second", causeSlug: "medical-financial-relief", programmeStatus: "COMPLETED", title: "Another completed case" };
    expect(selectCompletedMedicalAidShowcase([duplicate, ...records], new Set(["medical-second", "medical-completed", "medical-unknown"])).map(p => p.slug))
      .toEqual(["medical-second", "medical-completed"]);
  });
});
