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
  it("attempts every public and admin refresh independently if the appeal tag fails", () => {
    m.tag.mockImplementationOnce(() => { throw new Error("appeals tag offline"); });
    expect(expireDonationViews).toThrow("appeals tag offline");
    for (const path of ["/", "/appeals", "/admin/donations", "/admin/giving-funds"]) {
      expect(m.path).toHaveBeenCalledWith(path);
    }
    expect(m.path).toHaveBeenCalledTimes(4);
  });

  it("attempts the remaining cache routes if one path fails", () => {
    m.path.mockImplementationOnce(() => { throw new Error("homepage cache offline"); });
    expect(expireDonationViews).toThrow("homepage cache offline");
    expect(m.tag).toHaveBeenCalledExactlyOnceWith("appeals", { expire: 0 });
    expect(m.path.mock.calls).toEqual([
      ["/"], ["/appeals"], ["/admin/donations"], ["/admin/giving-funds"],
    ]);
  });

  it("does not swallow invalidation failure so a safe replay may retry it", () => {
    m.tag.mockImplementationOnce(() => { throw new Error("cache unavailable"); });
    expect(expireDonationViews).toThrow("cache unavailable");
    expireDonationViews();
    expect(m.tag).toHaveBeenCalledTimes(2);
  });
});
