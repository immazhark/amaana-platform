import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { array, maxLength, string } from "zod/mini";

describe("validation collection resource bounds", () => {
  it("rejects an oversized collection before validating its elements", () => {
    const inspectElement = vi.fn();
    const schema = z.array(z.string().superRefine(inspectElement)).max(50);
    const result = schema.safeParse(Array.from({ length: 1_000 }, () => "item"));

    expect(result.success).toBe(false);
    expect(inspectElement.mock.calls.length).toBe(0);
    if (!result.success) {
      expect(result.error.issues.length).toBe(1);
      expect(result.error.issues).toEqual([
        expect.objectContaining({ code: "too_big", maximum: 50, path: [] }),
      ]);
    }
  });

  it("also bounds issue allocation for oversized mini-schema collections", () => {
    const schema = array(string()).check(maxLength(50));
    const result = schema.safeParse(Array.from({ length: 1_000 }, () => 42));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBe(1);
      expect(result.error.issues).toEqual([
        expect.objectContaining({ code: "too_big", maximum: 50, path: [] }),
      ]);
    }
  });

  it("preserves accepted collections and element error paths within the bound", () => {
    const schema = z.array(z.string()).max(50);
    const accepted = Array.from({ length: 50 }, () => "item");
    expect(schema.parse(accepted)).toEqual(accepted);
    const result = schema.safeParse(["item", 42]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBe(1);
      expect(result.error.issues).toEqual([
        expect.objectContaining({ code: "invalid_type", path: [1] }),
      ]);
    }
  });
});
