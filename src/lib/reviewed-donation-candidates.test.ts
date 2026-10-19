import { describe, expect, it } from "vitest";
import { selectReviewedDonationCandidates } from "./reviewed-donation-candidates";

describe("reviewed public donation candidate selection", () => {
  it("finds payable appeals after four stale or exhausted public listings", async () => {
    const seen: number[] = [];
    const candidates = [1, 2, 3, 4, 5, 6];
    const selected = await selectReviewedDonationCandidates(candidates, async id => {
      seen.push(id);
      return id > 4 ? { id } : null;
    });
    expect(selected).toEqual([{ id: 5 }, { id: 6 }]);
    expect(seen).toEqual(candidates);
  });

  it("returns only four reviewed records in original public-order priority", async () => {
    const seen: number[] = [];
    const selected = await selectReviewedDonationCandidates([1, 2, 3, 4, 5, 6], async id => {
      seen.push(id);
      return id;
    });
    expect(selected).toEqual([1, 2, 3, 4]);
    expect(seen).toEqual([1, 2, 3, 4]);
  });

  it("never queries beyond twelve candidates even if none are payable", async () => {
    const seen: number[] = [];
    const selected = await selectReviewedDonationCandidates(Array.from({ length: 100 }, (_, n) => n), async id => {
      seen.push(id);
      return null;
    });
    expect(selected).toEqual([]);
    expect(seen).toEqual(Array.from({ length: 12 }, (_, n) => n));
  });

  it("keeps concurrent review reads bounded at four per batch", async () => {
    let inFlight = 0;
    let peak = 0;
    await selectReviewedDonationCandidates(Array.from({ length: 12 }, (_, n) => n), async () => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await Promise.resolve();
      inFlight--;
      return null;
    });
    expect(peak).toBe(4);
    expect(inFlight).toBe(0);
  });

  it("does not turn an infrastructure failure into a false no-appeals announcement", async () => {
    await expect(selectReviewedDonationCandidates([1], async () => {
      throw new Error("Database unavailable");
    })).rejects.toThrow("Database unavailable");
  });
});
