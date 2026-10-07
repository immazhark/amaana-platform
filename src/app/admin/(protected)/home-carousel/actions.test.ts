import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultHomeConfig } from '@/lib/home-carousel';
const m = vi.hoisted(()=>({permission:vi.fn(),publish:vi.fn(),find:vi.fn(),update:vi.fn(),create:vi.fn(),audit:vi.fn(),media:vi.fn(),review:vi.fn(),appeal:vi.fn()}));
vi.mock('@/lib/auth',()=>({requirePermission:m.permission,hasPermission:m.publish}));
vi.mock('@/lib/prisma',()=>({prisma:{}}));
vi.mock('@/lib/prisma-transaction',()=>({withSerializableTransactionRetry:(cb:(tx:unknown)=>unknown)=>cb({homeCarousel:{findUnique:m.find,updateMany:m.update,create:m.create},auditEvent:{create:m.audit,findFirst:m.review},mediaAsset:{findUnique:m.media},appeal:{findUnique:m.appeal}})}));
vi.mock('next/cache',()=>({revalidatePath:vi.fn(),revalidateTag:vi.fn()}));
vi.mock('next/navigation',()=>({redirect:(url:string)=>{throw new Error(url);}}));
import {saveHomeCarousel} from './actions';
function form(extra:Record<string,string>={}) { const data=new FormData(); Object.entries({...defaultHomeConfig.slides[0],revision:'1',operation:'save',...extra}).forEach(([k,v])=>data.set(k,String(v))); return data; }
describe('carousel admin boundary',()=>{
 beforeEach(()=>{vi.clearAllMocks();m.permission.mockResolvedValue({id:'editor'});m.publish.mockReturnValue(true);m.find.mockResolvedValue({revision:1,config:structuredClone(defaultHomeConfig)});m.update.mockResolvedValue({count:1});});
 it('requires update permission before reaching persistence',async()=>{m.permission.mockRejectedValue(new Error('Forbidden'));await expect(saveHomeCarousel(form())).rejects.toThrow('Forbidden');expect(m.find).not.toHaveBeenCalled();});
 it('rejects stale revisions without writes or audit',async()=>{await expect(saveHomeCarousel(form({revision:'0'}))).rejects.toThrow(/changed/);expect(m.update).not.toHaveBeenCalled();expect(m.audit).not.toHaveBeenCalled();});
 it('cannot edit or remove a published slide without approval permission',async()=>{m.publish.mockReturnValue(false);await expect(saveHomeCarousel(form())).rejects.toThrow(/Publishing/);await expect(saveHomeCarousel(form({operation:'remove'}))).rejects.toThrow(/Publishing/);expect(m.update).not.toHaveBeenCalled();});
 it('rejects a private or unreviewed image',async()=>{m.media.mockResolvedValue(null);await expect(saveHomeCarousel(form({image:'asset:private'}))).rejects.toThrow(/error=/);expect(m.update).not.toHaveBeenCalled();});
 it('saves with revision comparison and records the actor',async()=>{await expect(saveHomeCarousel(form())).rejects.toThrow('/admin/home-carousel?saved=1');expect(m.update).toHaveBeenCalledWith(expect.objectContaining({where:{id:'homepage',revision:1},data:expect.objectContaining({revision:{increment:1}})}));expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({actorId:'editor',action:'home_carousel.save'})}));});
 it('cannot remove the permanent general fallback',async()=>{m.find.mockResolvedValue({revision:1,config:{slides:[defaultHomeConfig.slides[0],{...defaultHomeConfig.slides[1],status:'DRAFT'}],appealPosition:1}});await expect(saveHomeCarousel(form({operation:'remove'}))).rejects.toThrow(/fallback/);expect(m.update).not.toHaveBeenCalled();});
 it('blocks a racing write with a failed revision comparison',async()=>{m.update.mockResolvedValue({count:0});await expect(saveHomeCarousel(form())).rejects.toThrow(/changed/);expect(m.audit).not.toHaveBeenCalled();});
});
