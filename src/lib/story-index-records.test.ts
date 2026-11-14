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

  it("rejects malformed published relationship labels before story cards render", () => {
    const publishedCause = { status: "PUBLISHED", title: "Reviewed cause" };
    const publicStory = { ...valid, cause: publishedCause, initiative: null };
    const badCause = { ...publicStory, cause: { status: "PUBLISHED", title: { private: "PRIVATE_CAUSE" } } };
    const badInitiative = {
      ...publicStory,
      initiative: { status: "PUBLISHED", title: { private: "PRIVATE_INITIATIVE" }, cause: publishedCause },
    };
    const badNestedCause = {
      ...publicStory,
      initiative: { status: "PUBLISHED", title: "Reviewed initiative", cause: { status: "PUBLISHED", title: { private: "PRIVATE_NESTED_CAUSE" } } },
    };
    const missingPublishedInitiativeCause = {
      ...publicStory,
      initiative: { status: "PUBLISHED", title: "Reviewed initiative", cause: null },
    };
    const unrelatedDraft = {
      ...publicStory,
      id: "reviewed-with-draft",
      cause: { status: "DRAFT", title: { draft: "NOT_PUBLIC" } },
    };
    const records = retainRoutableStoryRecords([badCause, badInitiative, badNestedCause, missingPublishedInitiativeCause, publicStory, unrelatedDraft] as unknown as Array<typeof publicStory>);
    expect(records).toEqual([publicStory, unrelatedDraft]);
    expect(JSON.stringify(records)).not.toContain("PRIVATE_");
  });

  it("preserves valid source order, identity and empty-inventory semantics", () => {
    const next = { ...valid, id: "synthetic-2", slug: "another-story" };
    const selected = retainRoutableStoryRecords([valid, next]);
    expect(selected).toEqual([valid, next]);
    expect(selected[0]).toBe(valid);
    expect(retainRoutableStoryRecords(null as unknown as Array<typeof valid>)).toEqual([]);
  });
});
