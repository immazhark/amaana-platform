import { hasPermission, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPublicMediaStorageReadiness } from "@/lib/storage";
import { IDENTITY_MEDIA_SORT_ORDER } from "@/lib/public-media";
import { createMediaAsset, deleteMediaAsset, setMediaPublication, updateMediaAsset } from "./actions";

type ReviewMetadata = {
  privacyClass?: string;
  consentStatus?: string;
  websiteApproved?: boolean;
  containsMinor?: boolean;
  containsPatient?: boolean;
  containsPrivateDocument?: boolean;
  heroEligible?: boolean;
  provenanceConfirmed?: boolean;
  reviewNotes?: string | null;
};

export default async function AdminMediaPage() {
  const user = await requirePermission("content.view");
  const canEdit = hasPermission(user, "content.update");
  const canApprove = hasPermission(user, "content.approve");
  const storage = getPublicMediaStorageReadiness();

  const [assets, causes, initiatives, stories, faith, reviewEvents] = await Promise.all([
    prisma.mediaAsset.findMany({ include: { cause: true, initiative: true, story: true, faithContent: true }, orderBy: [{ isPublic: "asc" }, { sourceYear: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }, { id: "desc" }] }),
    prisma.cause.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.initiative.findMany({ orderBy: [{ startYear: "desc" }, { title: "asc" }], select: { id: true, title: true } }),
    prisma.story.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.faithContent.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.auditEvent.findMany({ where: { entityType: "MediaAsset", action: "media.privacy_reviewed" }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { entityId: true, metadata: true, createdAt: true, actor: { select: { name: true } } } }),
  ]);

  const latestReview = new Map<string, { metadata: ReviewMetadata; createdAt: Date; reviewer: string }>();
  for (const event of reviewEvents) {
    if (!latestReview.has(event.entityId)) latestReview.set(event.entityId, { metadata: (event.metadata ?? {}) as ReviewMetadata, createdAt: event.createdAt, reviewer: event.actor.name });
  }

  const targetLabel = (asset: (typeof assets)[number]) => asset.initiative?.title ?? asset.story?.title ?? asset.cause?.title ?? asset.faithContent?.title ?? "Unlinked";

  return <>
    <div className="admin-heading"><div><p className="eyebrow">Content evidence</p><h1>Media review</h1><p className="lead">Upload and document authentic Amaana material here. Nothing appears publicly until an approver explicitly publishes it.</p></div></div>

    <section className="admin-card" style={{ marginBottom: "2rem" }}>
      <div className="admin-heading">
        <div><p className="eyebrow">Infrastructure preflight</p><h2>Public media readiness</h2></div>
        <span className="status-badge">{storage.deliveryReady ? "READY" : storage.uploadReady ? "STORAGE READY" : "CONFIG NEEDED"}</span>
      </div>
      <div className="admin-media-readiness">
        <div><strong>{storage.separateBucketConfigured ? "✓" : "—"} Separate public bucket</strong><small>{storage.separateBucketConfigured ? "Public campaign media is isolated from assistance documents." : "Configure PUBLIC_MEDIA_S3_BUCKET and do not reuse the private assistance bucket."}</small></div>
        <div><strong>{storage.uploadReady ? "✓" : "—"} Upload credentials</strong><small>{storage.uploadReady ? `Storage uploads are configured${storage.usingFallbackCredentials ? " using the shared provider credentials." : " with dedicated public-media credentials."}` : "Region, bucket and storage credentials are not yet complete."}</small></div>
        <div><strong>{storage.deliveryReady ? "✓" : "—"} HTTPS public delivery</strong><small>{storage.deliveryReady ? "Approved uploads can receive a renderable public URL." : storage.baseUrlConfigured && !storage.baseUrlSecure ? "PUBLIC_MEDIA_BASE_URL is set but must use HTTPS." : "Set PUBLIC_MEDIA_BASE_URL to the HTTPS CDN or public bucket origin before publication."}</small></div>
      </div>
      {!storage.deliveryReady && <p className="muted" style={{ marginTop: "1rem" }}>You may continue documenting existing reviewed public URLs. Direct file uploads should not be treated as publication-ready until the preflight is fully green.</p>}
    </section>

    {canEdit && <section className="admin-card" style={{ marginBottom: "2rem" }}>
      <h2>Add reviewed media</h2>
      <p className="muted">Use original campaign files where possible. Uploading creates an unpublished record first; publication is a separate privacy, consent and provenance review.</p>
      <form action={createMediaAsset} encType="multipart/form-data" className="form-grid">
        <div className="field full"><label htmlFor="target">Attach to</label><select id="target" name="target" required defaultValue=""><option value="" disabled>Select a cause, initiative, story or reflection</option><optgroup label="Initiatives">{initiatives.map(item => <option key={item.id} value={`initiative:${item.id}`}>{item.title}</option>)}</optgroup><optgroup label="Stories">{stories.map(item => <option key={item.id} value={`story:${item.id}`}>{item.title}</option>)}</optgroup><optgroup label="Causes">{causes.map(item => <option key={item.id} value={`cause:${item.id}`}>{item.title}</option>)}</optgroup><optgroup label="Faith & Reflections">{faith.map(item => <option key={item.id} value={`faith:${item.id}`}>{item.title}</option>)}</optgroup></select></div>
        <div className="field"><label htmlFor="kind">Media type</label><select id="kind" name="kind" defaultValue="IMAGE"><option value="IMAGE">Image</option><option value="DOCUMENT">Document</option></select></div>
        <div className="field"><label htmlFor="sourceYear">Source year</label><input id="sourceYear" name="sourceYear" type="number" min="2000" max="2100"/></div>
        <div className="field"><label htmlFor="mediaFile">File</label><input id="mediaFile" name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"/><small>JPEG, PNG, WebP or PDF · maximum 5 MB.</small></div>
        <div className="field"><label htmlFor="publicUrl">Existing public URL <span className="muted">optional</span></label><input id="publicUrl" name="publicUrl" placeholder="https://… or /media/…"/><small>Use this when the reviewed file is already hosted publicly.</small></div>
        <div className="field full"><label htmlFor="title">Title</label><input id="title" name="title" maxLength={160}/></div>
        <div className="field full"><label htmlFor="altText">Alt text</label><input id="altText" name="altText" maxLength={300}/><small>Required for images. Describe what is visibly present, not what you assume happened.</small></div>
        <div className="field full"><label htmlFor="caption">Caption</label><textarea id="caption" name="caption" maxLength={1000}/></div>
        <div className="field"><label htmlFor="sourcePath">Original source reference</label><input id="sourcePath" name="sourcePath" maxLength={500} placeholder="IMG_0138.jpg / archive path"/></div>
        <div className="field"><label htmlFor="sortOrder">Supporting-image order</label><input id="sortOrder" name="sortOrder" type="number" min="0" defaultValue="0"/><small>Used only for non-hero supporting media.</small></div>
        <div className="field full"><label className="checkbox"><input type="checkbox" name="identityImage"/><span><strong>Identity / hero image for this target</strong><small>Use one deliberate documentary photograph as the drive or initiative identity. It receives first priority for lead imagery and thumbnails; assigning a new identity image demotes the previous one.</small></span></label></div>
        <div className="field full"><button className="button" type="submit">Create unpublished media record</button></div>
      </form>
    </section>}

    <section className="admin-card">
      <div className="admin-heading"><div><p className="eyebrow">Publication gate</p><h2>Media library</h2></div><span className="status-badge">{assets.length} records</span></div>
      <p className="muted">Public evidence is different from private proof. Website publication now requires GREEN classification, confirmed provenance, an approved website channel, and consent that matches the people and context shown.</p>
      {assets.length === 0 ? <p className="empty-state">No media records yet.</p> : <div className="admin-media-list">{assets.map(asset => {
        const review = latestReview.get(asset.id);
        return <article className="admin-media-item" key={asset.id}>
          <div className="admin-media-summary"><div><span className="status-badge">{asset.isPublic ? "PUBLIC" : "PRIVATE REVIEW"}</span>{asset.kind === "IMAGE" && asset.sortOrder === IDENTITY_MEDIA_SORT_ORDER ? <span className="status-badge">IDENTITY HERO</span> : null}<small>{asset.kind.replaceAll("_", " ")} · {asset.sourceYear ?? "year not set"}</small></div><h3>{asset.title || asset.altText || asset.sourcePath || "Untitled media"}</h3><p>{targetLabel(asset)}</p>{asset.publicUrl ? <a href={asset.publicUrl} target="_blank" rel="noreferrer">Open public asset ↗</a> : <small>No public URL yet{asset.storageKey ? " — file is stored but needs PUBLIC_MEDIA_BASE_URL or a reviewed URL" : ""}.</small>}
          {review ? <div className="admin-media-review-summary"><strong>{review.metadata.privacyClass ?? "Reviewed"} · {review.metadata.consentStatus ?? "consent recorded"}</strong><small>Reviewed by {review.reviewer} on {review.createdAt.toLocaleDateString("en-IN")}. {review.metadata.heroEligible ? "Hero eligible." : "Not approved as a hero asset."}</small></div> : asset.isPublic ? <div className="admin-media-review-summary"><strong>Legacy public asset — structured governance review pending</strong><small>This asset predates the structured consent/provenance gate. It remains visible to avoid silently breaking published pages, but should be re-reviewed before reuse or hero promotion.</small></div> : null}
          </div>
          {canEdit && <form action={updateMediaAsset} className="form-grid admin-media-edit"><input type="hidden" name="id" value={asset.id}/><input type="hidden" name="expectedUpdatedAt" value={asset.updatedAt.toISOString()}/><div className="field"><label>Title</label><input name="title" defaultValue={asset.title ?? ""} maxLength={160}/></div><div className="field"><label>Source year</label><input name="sourceYear" type="number" min="2000" max="2100" defaultValue={asset.sourceYear ?? ""}/></div><div className="field full"><label>Public URL</label><input name="publicUrl" defaultValue={asset.publicUrl ?? ""}/></div><div className="field full"><label>Alt text</label><input name="altText" defaultValue={asset.altText ?? ""} maxLength={300}/></div><div className="field full"><label>Caption</label><textarea name="caption" defaultValue={asset.caption ?? ""} maxLength={1000}/></div><div className="field"><label>Source reference</label><input name="sourcePath" defaultValue={asset.sourcePath ?? ""} maxLength={500}/></div><div className="field"><label>Supporting-image order</label><input name="sortOrder" type="number" min="0" defaultValue={asset.sortOrder === IDENTITY_MEDIA_SORT_ORDER ? 0 : asset.sortOrder}/></div><div className="field full"><label className="checkbox"><input type="checkbox" name="identityImage" defaultChecked={asset.kind === "IMAGE" && asset.sortOrder === IDENTITY_MEDIA_SORT_ORDER}/><span><strong>Identity / hero image</strong><small>Exactly one identity image should represent each drive or initiative.</small></span></label></div><div className="field full"><button className="button secondary" type="submit">Save metadata</button></div></form>}
          {canApprove && !asset.isPublic && <form action={setMediaPublication} className="form-grid admin-media-publish"><input type="hidden" name="id" value={asset.id}/><input type="hidden" name="publish" value="true"/>
            <div className="field"><label>Privacy classification</label><select name="privacyClass" required defaultValue=""><option value="" disabled>Choose classification</option><option value="GREEN_PUBLIC">GREEN — approved public use</option><option value="AMBER_RESTRICTED">AMBER — restricted/contextual</option><option value="RED_PRIVATE">RED — private / do not publish</option></select></div>
            <div className="field"><label>Consent status</label><select name="consentStatus" required defaultValue=""><option value="" disabled>Choose consent status</option><option value="DOCUMENTED">Documented</option><option value="NOT_APPLICABLE">Not applicable</option><option value="RESTRICTED">Restricted</option><option value="NOT_APPROVED">Not approved</option></select></div>
            <div className="field full"><label className="checkbox"><input type="checkbox" name="provenanceConfirmed"/><span><strong>Source/provenance confirmed</strong><small>The programme/year/source association has been checked.</small></span></label></div>
            <div className="field full"><label className="checkbox"><input type="checkbox" name="websiteApproved"/><span><strong>Website is an approved usage channel</strong><small>Do not infer website permission from social-media publication alone.</small></span></label></div>
            <div className="field"><label className="checkbox"><input type="checkbox" name="containsMinor"/><span>Contains identifiable minor</span></label></div>
            <div className="field"><label className="checkbox"><input type="checkbox" name="containsPatient"/><span>Contains identifiable patient</span></label></div>
            <div className="field full"><label className="checkbox"><input type="checkbox" name="containsPrivateDocument"/><span><strong>Contains private document/data</strong><small>Checking this blocks publication.</small></span></label></div>
            <div className="field full"><label className="checkbox"><input type="checkbox" name="heroEligible"/><span><strong>Hero use approved</strong><small>Optional. Publication does not automatically make an asset suitable for high-prominence placement.</small></span></label></div>
            <div className="field full"><label>Review notes</label><textarea name="reviewNotes" maxLength={2000} placeholder="Consent source, crop restriction, provenance note or other publication context."/></div>
            <div className="field full"><button className="button" type="submit">Approve privacy gate & publish</button><small>AMBER/RED classifications, restricted consent, unconfirmed provenance, private documents, or child/patient media without documented consent will fail closed.</small></div>
          </form>}
          {canApprove && asset.isPublic && <form action={setMediaPublication} className="admin-media-publish"><input type="hidden" name="id" value={asset.id}/><input type="hidden" name="publish" value="false"/><button className="text-button" type="submit">Unpublish</button></form>}
          {canApprove && !asset.isPublic && <form action={deleteMediaAsset} className="form-grid admin-media-publish"><input type="hidden" name="id" value={asset.id}/><div className="field full"><label>Permanent deletion confirmation</label><input name="confirm" required pattern="DELETE" placeholder="Type DELETE"/><small>Deletes the unpublished record and its Amaana-managed storage object. External source URLs are not modified.</small></div><div className="field full"><button className="text-button" type="submit">Delete unpublished media permanently</button></div></form>}
        </article>;
      })}</div>}
    </section>
  </>;
}