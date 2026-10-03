import Link from 'next/link';
import { hasPermission, requirePermission } from '@/lib/auth';
import { getHomeCarouselConfig } from '@/lib/home-carousel-data';
import { HOME_ARTWORK } from '@/lib/home-carousel';
import { prisma } from '@/lib/prisma';
import { saveHomeCarousel } from './actions';
import styles from './editor.module.css';

export default async function HomeCarouselEditor({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const user = await requirePermission('content.update');
  const [{ config, revision }, assets, params] = await Promise.all([
    getHomeCarouselConfig(),
    prisma.mediaAsset.findMany({ where: { kind: 'IMAGE', isPublic: true, privacyApprovedAt: { not: null } }, select: { id: true, title: true, altText: true }, orderBy: { updatedAt: 'desc' }, take: 100 }),
    searchParams,
  ]);
  const canPublish = hasPermission(user, 'content.approve');
  return <section className={styles.editor}>
    <header><p className="eyebrow">Website content</p><h1>Homepage carousel</h1><p>Manage the order, text, links and images. Drafts stay private. Published slides appear during their scheduled window.</p><Link href="/">View homepage →</Link></header>
    {params.error ? <p role="alert" className={styles.error}>{params.error}</p> : params.saved ? <p role="status" className={styles.success}>Carousel saved. The homepage now uses the latest published configuration.</p> : null}
    <div className={styles.settings}>
      <div><h2>Live appeals appear automatically</h2><p>Published appeals appear only while fundraising is open. Paused, funded, closed or expired appeals disappear automatically. A linked custom slide follows the same rule.</p></div>
      {canPublish ? <form action={saveHomeCarousel}><input type="hidden" name="revision" value={revision}/><input type="hidden" name="operation" value="settings"/><label>Insert live appeals after this many slides<input type="number" name="appealPosition" min="0" max="20" defaultValue={config.appealPosition} required/></label><button type="submit" className="button">Save placement</button></form> : null}
    </div>
    <p>Images: upload and approve header images in <Link href="/admin/media">Media review</Link>, then select them here. Keep originals, privacy blur and correct programme mapping. An unavailable or revoked image uses the Amaana logo fallback.</p>
    {config.slides.toSorted((a,b) => a.order-b.order || a.id.localeCompare(b.id)).map(slide => <details className={styles.slide} key={slide.id} open={slide.id === 'origin'}>
      <summary><span>{slide.title}</span><small>{slide.status === 'PUBLISHED' ? 'Published' : 'Draft'} · Position {slide.order + 1}</small></summary>
      <form action={saveHomeCarousel}>
        <input type="hidden" name="revision" value={revision}/><input type="hidden" name="id" value={slide.id}/>
        <fieldset disabled={!canPublish && slide.status === 'PUBLISHED'}><legend>Slide content</legend><div className={styles.fields}>
          <label>Small heading<input name="eyebrow" defaultValue={slide.eyebrow} maxLength={70} required/></label>
          <label>Position<input name="order" type="number" defaultValue={slide.order} min="0" max="1000" required/></label>
          <label className={styles.full}>Title<input name="title" defaultValue={slide.title} minLength={5} maxLength={100} required/></label>
          <label className={styles.full}>Subtitle<textarea name="description" defaultValue={slide.description} minLength={20} maxLength={320} rows={3} required/></label>
          <label>Primary button label<input name="primaryLabel" defaultValue={slide.primaryLabel} minLength={2} maxLength={42} required/></label>
          <label>Primary button destination<input name="primaryHref" defaultValue={slide.primaryHref} maxLength={240} required/></label>
          <label>Secondary button label<input name="secondaryLabel" defaultValue={slide.secondaryLabel} maxLength={42}/></label>
          <label>Secondary button destination<input name="secondaryHref" defaultValue={slide.secondaryHref} maxLength={240}/></label>
          <label>Banner image<select name="image" defaultValue={slide.image}>{HOME_ARTWORK.map(key=><option key={key} value={key}>{key === 'logo' ? 'Amaana logo fallback' : `${key} · homepage artwork`}</option>)}{slide.image.startsWith('asset:') && !assets.some(a=>`asset:${a.id}`===slide.image) ? <option value={slide.image}>Current image · will be rechecked before saving</option> : null}{assets.map(a=><option key={a.id} value={`asset:${a.id}`}>{a.title || a.altText || a.id}</option>)}</select></label>
          <label>Image description<input name="imageAlt" defaultValue={slide.imageAlt} maxLength={200}/></label>
          <label>Image focus · horizontal (%)<input name="focalX" type="number" min="0" max="100" defaultValue={slide.focalX} required/></label>
          <label>Image focus · vertical (%)<input name="focalY" type="number" min="0" max="100" defaultValue={slide.focalY} required/></label>
          <label>Visibility<select name="status" defaultValue={slide.status}><option value="DRAFT">Draft</option><option value="PUBLISHED" disabled={!canPublish}>Published</option></select></label>
          <label>Linked appeal slug · optional<input name="appealSlug" defaultValue={slide.appealSlug} maxLength={160}/></label>
          <label>Starts at · UTC (optional)<input name="startsAt" type="datetime-local" defaultValue={slide.startsAt ? new Date(slide.startsAt).toISOString().slice(0,16) : ''}/></label>
          <label>Ends at · UTC (optional)<input name="endsAt" type="datetime-local" defaultValue={slide.endsAt ? new Date(slide.endsAt).toISOString().slice(0,16) : ''}/></label>
        </div><div className={styles.actions}><button type="submit" name="operation" value="save" className="button">Save slide</button><button type="submit" name="operation" value="remove" formNoValidate className="button secondary">Remove slide</button></div></fieldset>
      </form>
      {!canPublish && slide.status === 'PUBLISHED' ? <p>Publishing permission is required to change this live slide.</p> : null}
    </details>)}
    <form action={saveHomeCarousel}><input type="hidden" name="revision" value={revision}/><button type="submit" name="operation" value="add" className="button">Add a draft slide</button></form>
  </section>;
}
