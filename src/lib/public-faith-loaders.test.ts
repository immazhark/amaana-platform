import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ findMany: vi.fn(), findFirst: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { faithContent: mocks } }));
import { getPublishedFaithContent, getPublishedFaithContentBySlug, getFeaturedFaithContent } from "./public-content";
const reviewed = {status:"PUBLISHED",religiousReviewStatus:"VERIFIED",verifiedAt:new Date("2026-01-01"),sourceCitation:"Reviewed citation"};
beforeEach(() => vi.resetAllMocks());
it("filters incomplete citations from full public lists", async () => {
 mocks.findMany.mockResolvedValue([reviewed,{...reviewed,sourceCitation:"   "},{...reviewed,sourceCitation:null}]);
 expect(await getPublishedFaithContent()).toEqual([reviewed]);
});
it.each([getPublishedFaithContentBySlug,getFeaturedFaithContent])("hides incomplete detail/featured records", async loader => {
 mocks.findFirst.mockResolvedValue({...reviewed,sourceCitation:" "});
 expect(await loader("synthetic")).toBeNull();
 mocks.findFirst.mockResolvedValue(reviewed);
 expect(await loader("synthetic")).toEqual(reviewed);
 mocks.findFirst.mockResolvedValue(null);
 expect(await loader("synthetic")).toBeNull();
});
