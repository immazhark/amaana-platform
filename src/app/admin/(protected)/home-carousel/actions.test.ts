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
 it.each(['find','media','update','audit'] as const)('does not put unexpected %s diagnostics into the redirect',async boundary=>{
   const diagnostic='synthetic-private-database-diagnostic';
   m[boundary].mockRejectedValueOnce(new Error(diagnostic));
   const submitted=boundary==='media'?form({image:'asset:reviewed-image'}):form();
   let target='';
   try { await saveHomeCarousel(submitted); } catch(error) { target=error instanceof Error?error.message:''; }
   expect(target).toBe('/admin/home-carousel?error=Unable%20to%20save%20the%20carousel.');
   expect(target).not.toContain(diagnostic);
 });
 it('preserves safe field validation feedback',async()=>{
   await expect(saveHomeCarousel(form({title:''}))).rejects.toThrow(/title/);
   expect(m.update).not.toHaveBeenCalled();
 });
 it('does not trust an unexpected error merely named like a validation error',async()=>{
   const error=new Error('synthetic-private-diagnostic');
   error.name='HomeCarouselValidationError';
   m.find.mockRejectedValueOnce(error);
   await expect(saveHomeCarousel(form())).rejects.toThrow('/admin/home-carousel?error=Unable%20to%20save%20the%20carousel.');
 });
 it('returns a generic notice for a non-Error persistence failure',async()=>{
   m.find.mockRejectedValueOnce('synthetic-private-diagnostic');
   await expect(saveHomeCarousel(form())).rejects.toThrow('/admin/home-carousel?error=Unable%20to%20save%20the%20carousel.');
 });
});

describe('carousel numeric form input', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.permission.mockResolvedValue({ id: 'editor' });
    m.publish.mockReturnValue(true);
    m.find.mockResolvedValue({ revision: 1, config: structuredClone(defaultHomeConfig) });
    m.update.mockResolvedValue({ count: 1 });
  });

  it.each(['order', 'focalX', 'focalY'])('does not persist a blank %s as zero', async field => {
    await expect(saveHomeCarousel(form({ [field]: '' }))).rejects.toThrow(/error=/);
    expect(m.update).not.toHaveBeenCalled();
    expect(m.create).not.toHaveBeenCalled();
    expect(m.audit).not.toHaveBeenCalled();
  });

  it('does not persist a blank live appeal position as zero', async () => {
    await expect(saveHomeCarousel(form({ operation: 'settings', appealPosition: '' }))).rejects.toThrow(/error=/);
    expect(m.update).not.toHaveBeenCalled();
    expect(m.audit).not.toHaveBeenCalled();
  });

  it('requires an explicit revision even when the stored revision is zero', async () => {
    m.find.mockResolvedValue({ revision: 0, config: structuredClone(defaultHomeConfig) });
    const data = form();
    data.delete('revision');
    await expect(saveHomeCarousel(data)).rejects.toThrow(/Refresh/);
    expect(m.find).not.toHaveBeenCalled();
    expect(m.update).not.toHaveBeenCalled();
    expect(m.audit).not.toHaveBeenCalled();
  });

  it.each(['', ' ', '9007199254740992'])('rejects an invalid revision %s before reading stored configuration', async revision => {
    await expect(saveHomeCarousel(form({ revision }))).rejects.toThrow(/Refresh/);
    expect(m.find).not.toHaveBeenCalled();
    expect(m.update).not.toHaveBeenCalled();
    expect(m.audit).not.toHaveBeenCalled();
  });

  it('preserves valid zero live appeal placement', async () => {
    await expect(saveHomeCarousel(form({ operation: 'settings', appealPosition: '0' }))).rejects.toThrow('/admin/home-carousel?saved=1');
    expect(m.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ config: expect.objectContaining({ appealPosition: 0 }) }),
    }));
  });

  it('returns actionable feedback rather than a generic failure for malformed CTA escapes', async () => {
    await expect(saveHomeCarousel(form({ primaryHref: '/about%' }))).rejects.toThrow(/safe%20internal/);
    expect(m.update).not.toHaveBeenCalled();
    expect(m.audit).not.toHaveBeenCalled();
  });
});
