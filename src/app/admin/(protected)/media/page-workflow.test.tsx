import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ allowed:vi.fn(),permission:vi.fn(),count:vi.fn(),groups:vi.fn(),assets:vi.fn(),reviews:vi.fn(),causes:vi.fn(),initiatives:vi.fn(),stories:vi.fn(),faith:vi.fn(),appeals:vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission:m.permission,hasPermission:m.allowed }));
vi.mock("@/lib/prisma", () => ({ prisma: { mediaAsset:{count:m.count,groupBy:m.groups,findMany:m.assets},cause:{findMany:m.causes},initiative:{findMany:m.initiatives},story:{findMany:m.stories},faithContent:{findMany:m.faith},appeal:{findMany:m.appeals},auditEvent:{findMany:m.reviews} } }));
vi.mock("@/lib/storage", () => ({ getPublicMediaStorageReadiness: () => ({ uploadReady:true,deliveryReady:true,separateBucketConfigured:true,usingFallbackCredentials:false,baseUrlConfigured:true,baseUrlSecure:true }) }));
vi.mock("@/components/curated-gallery-importer", () => ({ CuratedGalleryImporter: () => <section>OLD 154-IMAGE IMPORT WIDGET</section> }));
vi.mock("./actions", () => ({ createMediaAsset:vi.fn(),deleteMediaAsset:vi.fn(),setMediaPublication:vi.fn(),updateMediaAsset:vi.fn() }));
import AdminMediaPage from "./page";
beforeEach(() => {
  vi.resetAllMocks();m.permission.mockResolvedValue({id:"synthetic-admin"});m.allowed.mockReturnValue(true);m.count.mockResolvedValue(0);
  m.groups.mockResolvedValue([{isPublic:true,_count:{_all:154}}]);m.assets.mockResolvedValue([]);m.reviews.mockResolvedValue([]);
  for(const fn of [m.causes,m.initiatives,m.stories,m.faith])fn.mockResolvedValue([]);
  m.appeals.mockResolvedValue([{id:"synthetic-appeal",title:"Synthetic Mr Khaja appeal",status:"PUBLISHED"}]);
});
it("retires the one-time importer while preserving a published archive link",async()=>{
 const html=renderToStaticMarkup(await AdminMediaPage({searchParams:Promise.resolve({})}));
 expect(html).not.toContain("OLD 154-IMAGE IMPORT WIDGET");
 expect(html).toContain("Published (154)");
});
it("includes a live appeal as a selectable media destination with manual cover instructions",async()=>{
 const html=renderToStaticMarkup(await AdminMediaPage({searchParams:Promise.resolve({})}));
 expect(m.appeals).toHaveBeenCalledOnce();
 expect(html).toContain('value="appeal:synthetic-appeal"');
 expect(html).toContain("Synthetic Mr Khaja appeal");
 expect(html).toMatch(/copy[\s\S]{0,300}cover/i);
});
it("opens with the pending review queue instead of showing all 154 published media cards",async()=>{
 const html=renderToStaticMarkup(await AdminMediaPage({searchParams:Promise.resolve({})}));
 expect(m.count).toHaveBeenCalledWith({where:{isPublic:false}});
 expect(m.assets).toHaveBeenCalledWith(expect.objectContaining({where:{isPublic:false}}));
 expect(html).toContain("No images awaiting review");
 expect(html).toContain('href="/admin/media?visibility=public"');
});
it("preserves a separate published archive view",async()=>{
 await AdminMediaPage({searchParams:Promise.resolve({visibility:"public"})});
 expect(m.count).toHaveBeenCalledWith({where:{isPublic:true}});
});
