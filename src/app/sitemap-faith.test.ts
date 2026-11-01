import { beforeEach, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({faith:vi.fn(),empty:vi.fn(),indexing:vi.fn()}));
vi.mock("@/lib/prisma",()=>({prisma:{faithContent:{findMany:mocks.faith},appeal:{findMany:mocks.empty},initiative:{findMany:mocks.empty},story:{findMany:mocks.empty}}}));
vi.mock("@/lib/site-indexing",()=>({shouldAllowIndexing:mocks.indexing}));
import sitemap from "./sitemap";
const reviewed={slug:"reviewed-citation",updatedAt:new Date("2026-01-01"),status:"PUBLISHED",religiousReviewStatus:"VERIFIED",verifiedAt:new Date("2026-01-01"),sourceCitation:"Reviewed source"};
beforeEach(()=>{vi.resetAllMocks();mocks.indexing.mockReturnValue(true);mocks.empty.mockResolvedValue([]);mocks.faith.mockResolvedValue([]);});
it("omits incomplete Faith citations and emits only public sitemap fields",async()=>{
 mocks.faith.mockResolvedValue([reviewed,...["", "   ", null].map((sourceCitation,i)=>({...reviewed,slug:`incomplete-${i}`,sourceCitation}))]);
 const entries=(await sitemap()).filter(item=>item.url.includes("/faith-and-reflections/"));
 expect(entries).toEqual([{url:expect.stringContaining("/faith-and-reflections/reviewed-citation"),lastModified:reviewed.updatedAt,changeFrequency:"monthly",priority:0.7}]);
 expect(JSON.stringify(entries)).not.toContain("Reviewed source");
});
it("does not query content when indexing is disabled",async()=>{
 mocks.indexing.mockReturnValue(false);
 expect(await sitemap()).toEqual([]);
 expect(mocks.faith).not.toHaveBeenCalled();expect(mocks.empty).not.toHaveBeenCalled();
});
