import { describe, expect, it } from "vitest";
import { adjacentGalleryId } from "./gallery-selection";

const items = [{ id: "a" }, { id: "b" }, { id: "c" }] as const;
const reordered = [items[2], items[1], items[0]] as const;

describe("stable gallery selection", () => {
  it.each([
    [[], null, 1, null], [[], null, -1, null],
    [items, null, 1, "a"], [items, null, -1, "a"],
    [items, "a", -1, "c"], [items, "c", 1, "a"],
    [items, "b", 1, "c"], [items, "b", -1, "a"],
    [reordered, "b", 1, "a"], [reordered, "b", -1, "c"],
    [items, "removed", 1, "a"], [items, "removed", -1, "a"],
    [[items[1]], "b", 1, "b"], [[items[1]], "b", -1, "b"],
  ] as const)("navigates %j from %s in direction %i", (collection, current, direction, expected) => {
    expect(adjacentGalleryId(collection, current, direction)).toBe(expected);
  });
});
