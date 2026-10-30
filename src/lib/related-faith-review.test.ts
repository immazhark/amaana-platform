import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ initiative:vi.fn(),faith:vi.fn(),empty:vi.fn() }));
vi.mock("@/lib/prisma",()=>({prisma:{initiative:{findFirst:mocks.initiative,findMany:mocks.empty},faithContent:{findFirst:mocks.faith},story:{findMany:mocks.empty},appeal:{findMany:mocks.empty,fields:{goalAmount:"goalAmount"}}}}));
vi.mock("next/cache",()=>({unstable_cache:(read:unknown)=>read}));
import { getPublishedInitiativeBySlug,getHomepagePublicContent } from "./public-content";
const review={status:"PUBLISHED",religiousReviewStatus:"VERIFIED",verifiedAt:new Date("2026-01-01"),sourceCitation:"Reviewed citation"};
const card={id:"reviewed",slug:"reviewed",title:"Reviewed",excerpt:"Context"};
beforeEach(()=>{vi.resetAllMocks();mocks.empty.mockResolvedValue([]);});
it("filters related Faith cards and returns only original public fields",async()=>{
 mocks.initiative.mockResolvedValue({slug:"initiative",faithContent:[{...card,...review},{...card,...review,sourceCitation:"   "}]});
 expect(await getPublishedInitiativeBySlug("initiative")).toEqual({slug:"initiative",faithContent:[card]});
 mocks.initiative.mockResolvedValue(null);
 expect(await getPublishedInitiativeBySlug("missing")).toBeNull();
});
it("hides incomplete homepage Faith and preserves the public featured shape",async()=>{
 mocks.faith.mockResolvedValue({...review,type:"ARTICLE",title:"Reviewed",excerpt:"Context",sourceCitation:" "});
 expect((await getHomepagePublicContent()).featuredFaith).toBeNull();
 mocks.faith.mockResolvedValue({...review,type:"ARTICLE",title:"Reviewed",excerpt:"Context"});
 expect((await getHomepagePublicContent()).featuredFaith).toEqual({type:"ARTICLE",title:"Reviewed",excerpt:"Context"});
});
