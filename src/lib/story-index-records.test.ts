import { describe, expect, it } from "vitest";
import { retainRoutableStoryRecords } from "./story-index-records";

const valid = {
  id: "synthetic-1", slug: "reviewed-story", title: "A reviewed story", summary: "Public context",
};

describe("public story index identity boundary", () => {
  it("rejects malformed or unroutable records before building the ID query", () => {
    const malformed = [
      null, undefined,
      { ...valid, id: undefined },
      { ...valid, id: "" },
      { ...valid, slug: { private: "PRIVATE_SLUG" } },
      { ...valid, slug: "../admin" },
    ] as unknown as Array<typeof valid>;
    const selected = retainRoutableStoryRecords([...malformed, valid]);
    expect(selected).toEqual([valid]);
    expect(JSON.stringify(selected)).not.toContain("PRIVATE_SLUG");
  });

  it("preserves valid source order, identity and empty-inventory semantics", () => {
    const next = { ...valid, id: "synthetic-2", slug: "another-story" };
    const selected = retainRoutableStoryRecords([valid, next]);
    expect(selected).toEqual([valid, next]);
    expect(selected[0]).toBe(valid);
    expect(retainRoutableStoryRecords(null as unknown as Array<typeof valid>)).toEqual([]);
  });
});
