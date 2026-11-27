import { describe, expect, it, vi } from "vitest";
import { readDonationReport } from "./read-donation-report";

describe("optional donation reports", () => {
  it("preserves successful zero counts and other reads when a report rejects", async () => {
    const unavailable = vi.fn();
    const result = await Promise.all([Promise.resolve(["synthetic-record"]), readDonationReport(async () => { throw new Error("PRIVATE_SYNTHETIC"); }, unavailable), readDonationReport(async () => ({ total: 0 }), unavailable)]);
    expect(result).toEqual([["synthetic-record"], null, { total: 0 }]);
    expect(unavailable).toHaveBeenCalledOnce();
  });
  it("distinguishes synchronous query failure from an empty result", async () => {
    const unavailable = vi.fn();
    expect(await readDonationReport(() => { throw new Error("PRIVATE_SYNTHETIC"); }, unavailable)).toBeNull();
    expect(unavailable).toHaveBeenCalledOnce();
  });
  it("does not swallow independent core read failure", async () => {
    await expect(Promise.all([Promise.reject(new Error("core failure")), readDonationReport(async () => 5, vi.fn())])).rejects.toThrow("core failure");
  });
});
