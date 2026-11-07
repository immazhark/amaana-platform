import { beforeEach,expect,it,vi } from "vitest";
const m=vi.hoisted(()=>({permission:vi.fn(),findAppeal:vi.fn(),create:vi.fn(),audit:vi.fn(),tx:vi.fn(),upload:vi.fn(),cleanup:vi.fn(),revalidate:vi.fn()}));
vi.mock("next/cache",()=>({revalidatePath:m.revalidate}));
vi.mock("@/lib/auth",()=>({requirePermission:m.permission,hasPermission:()=>true}));
vi.mock("@/lib/prisma",()=>({prisma:{appeal:{findUnique:m.findAppeal},mediaAsset:{create:m.create},auditEvent:{create:m.audit}}}));
vi.mock("@/lib/prisma-transaction",()=>({withSerializableTransactionRetry:m.tx}));
vi.mock("@/lib/storage",()=>({uploadPublicMediaFile:m.upload,validatePublicMediaFile:vi.fn(),deletePublicMediaObject:m.cleanup}));
vi.mock("@/lib/public-media",()=>({normalizeSafePublicMediaUrl:(s:string)=>s.trim(),IDENTITY_MEDIA_SORT_ORDER:-1000,canRenderPublicMedia:()=>true}));
vi.mock("@/lib/media-governance",()=>({mediaPublicationIssues:()=>[],parseMediaPublicationReview:()=>({})}));
import { createMediaAsset } from "./actions";
function form(target:string){const f=new FormData();f.set("target",target);f.set("kind","IMAGE");f.set("publicUrl","https://example.invalid/redacted.png");f.set("altText","Synthetic redacted photo");return f;}
beforeEach(()=>{
 vi.clearAllMocks();m.permission.mockResolvedValue({id:"synthetic-admin"});m.findAppeal.mockResolvedValue({id:"synthetic-appeal",status:"PUBLISHED"});
 m.create.mockResolvedValue({id:"synthetic-media"});m.audit.mockResolvedValue({id:"synthetic-audit"});
 m.tx.mockImplementation(async (cb:(tx:unknown)=>unknown)=>cb({appeal:{findUnique:m.findAppeal},mediaAsset:{create:m.create},auditEvent:{create:m.audit}}));
});
it("creates an unpublished, audit-tracked appeal photo candidate without inventing an appeal foreign key",async()=>{
 await createMediaAsset(form("appeal:synthetic-appeal"));
 expect(m.findAppeal).toHaveBeenCalledWith(expect.objectContaining({where:{id:"synthetic-appeal"}}));
 expect(m.create).toHaveBeenCalledWith({data:expect.objectContaining({isPublic:false,kind:"IMAGE"})});
 expect(m.create.mock.calls[0]?.[0]?.data).not.toHaveProperty("appealId");
 expect(m.audit).toHaveBeenCalledWith({data:expect.objectContaining({action:"media.created",metadata:expect.objectContaining({target:expect.objectContaining({appealId:"synthetic-appeal"})})})});
});
it.each(["missing","closed"])("fails closed for %s appeal, before storage or writes",async state=>{
 m.findAppeal.mockResolvedValue(state==="missing"?null:{id:"synthetic-appeal",status:"CLOSED"});
 await expect(createMediaAsset(form("appeal:synthetic-appeal"))).rejects.toThrow(/appeal.*(not available|not found|inactive|cannot)/i);
 expect(m.create).not.toHaveBeenCalled();expect(m.upload).not.toHaveBeenCalled();
});
