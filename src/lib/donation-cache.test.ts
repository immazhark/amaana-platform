import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ tag: vi.fn(), path: vi.fn() }));
vi.mock("next/cache", () => ({ revalidateTag: m.tag, revalidatePath: m.path }));
import { expireDonationViews } from "./donation-cache";
describe("route-handler financial view expiry", () => {
  beforeEach(() => vi.resetAllMocks());
  it("expires shared data immediately and refreshes derived paths", () => {
    expireDonationViews();
    expect(m.tag).toHaveBeenCalledExactlyOnceWith("appeals", { expire: 0 });
    for (const path of ["/", "/appeals", "/admin/donations", "/admin/giving-funds"]) expect(m.path).toHaveBeenCalledWith(path);
  });
  it("does not swallow invalidation failure so a safe replay may retry it", () => {
    m.tag.mockImplementationOnce(() => { throw new Error("cache unavailable"); });
    expect(expireDonationViews).toThrow("cache unavailable");
    expireDonationViews();
    expect(m.tag).toHaveBeenCalledTimes(2);
  });
});
