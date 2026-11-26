import { describe, expect, it, vi } from "vitest";
import { assistanceFieldFocusTarget, firstInvalidAssistanceStep } from "./assistance-step-review";

describe("assistance step review", () => {
  it("stops at the first invalid intermediate step rather than skipping to confirmation", () => {
    const validate = vi.fn((step: number) => step !== 2);
    expect(firstInvalidAssistanceStep(1, 4, validate)).toBe(2);
    expect(validate.mock.calls).toEqual([[1], [2]]);
  });
  it("checks evidence on forward jumps but never validates backward navigation", () => {
    const validate = vi.fn((step: number) => step !== 3);
    expect(firstInvalidAssistanceStep(1, 4, validate)).toBe(3);
    expect(validate.mock.calls).toEqual([[1], [2], [3]]);
    validate.mockClear();
    expect(firstInvalidAssistanceStep(4, 1, validate)).toBeNull();
    expect(validate).not.toHaveBeenCalled();
    expect(firstInvalidAssistanceStep(2, 4, () => true)).toBeNull();
  });
  it("focuses the checked residence radio or first radio instead of a RadioNodeList", () => {
    const checked = {}, first = {}, phone = {};
    const form = { querySelector: (selector: string) => selector.endsWith(":checked") ? checked : first, elements: { namedItem: () => phone } };
    expect(assistanceFieldFocusTarget(form as unknown as HTMLFormElement, "beneficiaryResidence")).toBe(checked);
    expect(assistanceFieldFocusTarget({ ...form, querySelector: (selector: string) => selector.endsWith(":checked") ? null : first } as unknown as HTMLFormElement, "beneficiaryResidence")).toBe(first);
    expect(assistanceFieldFocusTarget(form as unknown as HTMLFormElement, "phone")).toBe(phone);
  });
});
