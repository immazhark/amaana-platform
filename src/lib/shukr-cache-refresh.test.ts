import { describe, expect, it, vi } from "vitest";
const refresh = vi.hoisted(() => vi.fn());
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: refresh }));
import { refreshShukrViewsAfterConsent } from "./shukr-cache-refresh";

describe("Shukr privacy transaction/cache boundary", () => {
  it("refreshes both public and staff views without accessing private receipt data", () => {
    refresh.mockReset();
    refreshShukrViewsAfterConsent();
    expect(refresh.mock.calls).toEqual([["/shukr"], ["/admin/donations/recognition"]]);
  });
  it("does not signal a failed donation consent when either cache refresh throws", () => {
    refresh.mockReset();
    refresh.mockImplementationOnce(() => { throw new Error("cache offline"); });
    expect(() => refreshShukrViewsAfterConsent()).not.toThrow();
    expect(refresh).toHaveBeenCalledTimes(2);
    refresh.mockReset();
    refresh.mockImplementationOnce(() => undefined)
      .mockImplementationOnce(() => { throw new Error("admin invalidation unavailable"); });
    expect(() => refreshShukrViewsAfterConsent()).not.toThrow();
  });
});
