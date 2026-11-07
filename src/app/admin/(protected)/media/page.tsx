import Link from "next/link";
import styles from "./media-workflow.module.css";
import { getAdminPagination, parseAdminPage } from "@/lib/admin-pagination";
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

type Props = { searchParams: Promise<{ visibility?: string; page?: string }> };

export default async function AdminMediaPage({ searchParams }: Props) {
  const user = await requirePermission("content.view");
  const canEdit = hasPermission(user, "content.update");
  const canApprove = hasPermission(user, "content.approve");
  const storage = getPublicMediaStorageReadiness();
  const { visibility, page: pageParam } = await searchParams;
  // Daily operations begin with the pending queue. The published archive is
  // preserved behind its explicit filter, not mixed into review work.
  const selectedVisibility = visibility === "public" || visibility === "all" ? visibility : "review";
  const where = selectedVisibility === "all" ? undefined : { isPublic: selectedVisibility === "public" };
  const canSelectAppeals = canEdit && hasPermission(user, "appeal.view");
  const [totalItems, visibilityGroups, causes, initiatives, stories, faith, appeals] = await Promise.all([
    prisma.mediaAsset.count({ where }),
    prisma.mediaAsset.groupBy({ by: ["isPublic"], _count: { _all: true } }),
    canEdit ? prisma.cause.findMany({ where: { status: { not: "ARCHIVED" } }, orderBy: { title: "asc" }, select: { id: true, title: true } }) : Promise.resolve([]),
    canEdit ? prisma.initiative.findMany({ where: { status: { not: "ARCHIVED" } }, orderBy: [{ startYear: "desc" }, { title: "asc" }], select: { id: true, title: true } }) : Promise.resolve([]),
    canEdit ? prisma.story.findMany({ where: { status: { not: "ARCHIVED" } }, orderBy: { title: "asc" }, select: { id: true, title: true } }) : Promise.resolve([]),
    canEdit ? prisma.faithContent.findMany({ where: { status: { not: "ARCHIVED" } }, orderBy: { title: "asc" }, select: { id: true, title: true } }) : Promise.resolve([]),
    canSelectAppeals ? prisma.appeal.findMany({
      where: { status: { in: ["DRAFT", "UNDER_REVIEW", "PUBLISHED", "PAUSED"] } },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: 100,
      select: { id: true, title: true, status: true },
    }) : Promise.resolve([]),
  ]);
  const pagination = getAdminPagination(totalItems, parseAdminPage(pageParam));
  const assets = await prisma.mediaAsset.findMany({
    where,
    include: { cause: true, initiative: true, story: true, faithContent: true },
    orderBy: [{ isPublic: "asc" }, { sourceYear: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }, { id: "desc" }],
    skip: pagination.skip,
    take: pagination.pageSize,
  });
  const reviewEvents = assets.length === 0 ? [] : await prisma.auditEvent.findMany({
    where: { entityType: "MediaAsset", entityId: { in: assets.map(asset => asset.id) }, action: { in: ["media.created", "media.privacy_reviewed"] } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { entityId: true, action: true, metadata: true, createdAt: true, actor: { select: { name: true } } },
  });
  const visibilityCounts = new Map(visibilityGroups.map(item => [item.isPublic, item._count._all]));
  const pageHref = (targetPage: number) => ({
    pathname: "/admin/media",
    query: { visibility: selectedVisibility, page: targetPage },
  });

  const latestReview = new Map<string, { metadata: ReviewMetadata; createdAt: Date; reviewer: string }>();
  const intendedAppeals = new Map<string, string>();
  for (const event of reviewEvents) {
    if (event.action === "media.privacy_reviewed" && !latestReview.has(event.entityId)) {
      latestReview.set(event.entityId, {
        metadata: (event.metadata ?? {}) as ReviewMetadata,
        createdAt: event.createdAt,
        reviewer: event.actor.name,
      });
    }
    if (event.action === "media.created" && !intendedAppeals.has(event.entityId)) {
      const metadata = event.metadata;
      if (metadata && typeof metadata === "object" && !Array.isArray(metadata) &&
          "target" in metadata && metadata.target && typeof metadata.target === "object" &&
          !Array.isArray(metadata.target) && "appealId" in metadata.target &&
          typeof metadata.target.appealId === "string") {
        intendedAppeals.set(event.entityId, metadata.target.appealId);
      }
    }
  }
  const appealTitles = new Map(appeals.map(appeal => [appeal.id, appeal.title]));
  const targetLabel = (asset: (typeof assets)[number]) => {
    const appealId = intendedAppeals.get(asset.id);
    if (appealId) return appealTitles.has(appealId) ? `Cover candidate for ${appealTitles.get(appealId)}` : "Appeal cover candidate";
    return asset.initiative?.title ?? asset.story?.title ?? asset.cause?.title ?? asset.faithContent?.title ?? "Unlinked";
  };

  return <>
    <div className="admin-heading">
      <div>
        <p className="eyebrow">Content operations</p>
        <h1>Media library</h1>
        <p className="lead">Upload, review and reuse approved photos. Existing images stay in the published archive.</p>
      </div>
      {canEdit && <a className="button secondary" href="#new-media">Upload a photo</a>}
    </div>

    <ol className={styles.steps} aria-label="Image approval workflow">
      <li><strong>1. Upload</strong><span>Add an original or privacy-redacted image.</span></li>
      <li><strong>2. Review</strong><span>Confirm provenance, consent and public-use safety.</span></li>
      <li><strong>3. Use</strong><span>Copy the approved URL into the appeal cover field.</span></li>
    </ol>

    <details className={styles.diagnostics} open={!storage.deliveryReady}>
      <summary>Storage diagnostics <span className="status-badge">{storage.deliveryReady ? "READY" : storage.uploadReady ? "STORAGE READY" : "CONFIG NEEDED"}</span></summary>
      <div className="admin-media-readiness">
        <div><strong>{storage.separateBucketConfigured ? "✓" : "—"} Separate public bucket</strong><small>{storage.separateBucketConfigured ? "Public campaign media is isolated from assistance documents." : "Configure PUBLIC_MEDIA_S3_BUCKET and do not reuse the private assistance bucket."}</small></div>
        <div><strong>{storage.uploadReady ? "✓" : "—"} Upload credentials</strong><small>{storage.uploadReady ? `Storage uploads are configured${storage.usingFallbackCredentials ? " using the shared provider credentials." : " with dedicated public-media credentials."}` : "Region, bucket and storage credentials are not yet complete."}</small></div>
        <div><strong>{storage.deliveryReady ? "✓" : "—"} Consent-gated public delivery</strong><small>{storage.deliveryReady ? "Managed uploads use Amaana's consent-gated /media/ route." : storage.baseUrlConfigured && !storage.baseUrlSecure ? "PUBLIC_MEDIA_BASE_URL must be HTTPS, with the official /media path." : "Configure public media delivery before publishing."}</small></div>
      </div>
      {!storage.deliveryReady && <p className="muted">Managed media cannot be published until storage and public delivery checks pass.</p>}
    </details>

    {canEdit && <section id="new-media" className="admin-card" style={{ marginBottom: "1.5rem" }}>
      <div className="admin-heading">
        <div><p className="eyebrow">New image</p><h2>Upload media for review</h2>
          <p className="muted">Uploads are private until an authorised reviewer approves them. Never upload identifiable patient faces or private medical documents.</p>
        </div>
      </div>
      <form action={createMediaAsset} encType="multipart/form-data" className="form-grid">
        <div className="field full">
          <label htmlFor="target">Where will this image be used?</label>
          <select id="target" name="target" required defaultValue="">
            <option value="" disabled>Choose an active appeal or content item</option>
            {canSelectAppeals && appeals.length > 0 && <optgroup label="Fundraising appeals — cover photos">{appeals.map(appeal => <option key={appeal.id} value={`appeal:${appeal.id}`}>{appeal.title} ({appeal.status.replaceAll("_", " ").toLowerCase()})</option>)}</optgroup>}
            {initiatives.length > 0 && <optgroup label="Initiatives">{initiatives.map(item => <option key={item.id} value={`initiative:${item.id}`}>{item.title}</option>)}</optgroup>}
            {causes.length > 0 && <optgroup label="Causes">{causes.map(item => <option key={item.id} value={`cause:${item.id}`}>{item.title}</option>)}</optgroup>}
            {stories.length > 0 && <optgroup label="Stories">{stories.map(item => <option key={item.id} value={`story:${item.id}`}>{item.title}</option>)}</optgroup>}
            {faith.length > 0 && <optgroup label="Faith & Reflections">{faith.map(item => <option key={item.id} value={`faith:${item.id}`}>{item.title}</option>)}</optgroup>}
          </select>
          <small>For an appeal: upload here, complete privacy approval, then copy the approved image URL into the appeal cover field. This does not set the cover or publish an appeal automatically. <Link href="/admin/appeals" className="inline-link">Manage appeals</Link>.</small>
        </div>
        <div className="field">
          <label htmlFor="kind">Media type</label>
          <select id="kind" name="kind" defaultValue="IMAGE"><option value="IMAGE">Image</option><option value="DOCUMENT">Document</option></select>
        </div>
        <div className="field">
          <label htmlFor="mediaFile">Upload file</label>
          <input id="mediaFile" name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"/>
          <small>JPG, PNG, WebP or PDF · maximum 5 MB. Use a file or an existing hosted URL, never both.</small>
        </div>
        <div className="field full">
          <label htmlFor="title">Image title</label><input id="title" name="title" maxLength={160} placeholder="e.g. Mr. Khaja — privacy-redacted hospital photograph"/>
        </div>
        <div className="field full">
          <label htmlFor="altText">Alt text</label><input id="altText" name="altText" maxLength={300} placeholder="Describe the visible image accurately"/>
          <small>Required for images. Do not add medical diagnoses or identifiers that cannot be publicly disclosed.</small>
        </div>
        <details className={`${styles.disclosure} field full`}>
          <summary>Optional settings — existing URL, caption, source and programme hero</summary>
          <div className="form-grid">
            <div className="field full"><label htmlFor="publicUrl">Existing approved HTTPS URL</label><input id="publicUrl" name="publicUrl" placeholder="https://… or /media/…"/><small>Only if already hosted. Leave empty when uploading a file.</small></div>
            <div className="field"><label htmlFor="sourceYear">Source year</label><input id="sourceYear" name="sourceYear" type="number" min="2000" max="2100"/></div>
            <div className="field"><label htmlFor="sourcePath">Original source reference</label><input id="sourcePath" name="sourcePath" maxLength={500}/></div>
            <div className="field full"><label htmlFor="caption">Caption</label><textarea id="caption" name="caption" maxLength={1000}/></div>
            <div className="field"><label htmlFor="sortOrder">Supporting-image order</label><input id="sortOrder" name="sortOrder" type="number" min="0" defaultValue="0"/></div>
            <div className="field full"><label className="checkbox"><input type="checkbox" name="identityImage"/><span><strong>Programme identity / hero image</strong><small>For causes and initiatives only. Do not select for an appeal: appeal cover use is reviewed separately.</small></span></label></div>
          </div>
        </details>
        <div className="field full"><button className="button" type="submit">Upload for private review</button></div>
      </form>
    </section>}

    <section className="admin-card">
      <div className="admin-heading"><div><p className="eyebrow">Existing media</p><h2>Review queue and published archive</h2></div><span className="status-badge">{pagination.totalItems} in this view</span></div>
      <nav className="filter-row" aria-label="Media publication filter">
        <Link href="/admin/media" aria-current={selectedVisibility === "review" ? "page" : undefined}>Awaiting review ({visibilityCounts.get(false) ?? 0})</Link>
        <Link href="/admin/media?visibility=public" aria-current={selectedVisibility === "public" ? "page" : undefined}>Published ({visibilityCounts.get(true) ?? 0})</Link>
        <Link href="/admin/media?visibility=all" aria-current={selectedVisibility === "all" ? "page" : undefined}>All media</Link>
      </nav>
      <p className="muted">Review images before public use. Published images are retained in the archive; uploading never means publication.</p>
      {assets.length === 0 ? <p className="empty-state">{selectedVisibility === "review" ? "No images awaiting review." : selectedVisibility === "public" ? "No public media records match this filter." : "No media records yet."} {selectedVisibility !== "all" && <Link className="inline-link" href="/admin/media?visibility=all">Clear filter</Link>}</p> : <div className={styles.library}>{assets.map(asset => {
        const review = latestReview.get(asset.id);
        return <article className="admin-media-item" key={asset.id}>
          <div className="admin-media-summary"><div><span className="status-badge">{asset.isPublic ? "PUBLIC" : "PRIVATE REVIEW"}</span>{asset.kind === "IMAGE" && asset.sortOrder === IDENTITY_MEDIA_SORT_ORDER ? <span className="status-badge">IDENTITY HERO</span> : null}<small>{asset.kind.replaceAll("_", " ")} · {asset.sourceYear ?? "year not set"}</small></div><h3>{asset.title || asset.altText || asset.sourcePath || "Untitled media"}</h3><p>{targetLabel(asset)}</p>{asset.publicUrl && asset.isPublic ? <><a href={asset.publicUrl} target="_blank" rel="noreferrer">Open public asset ↗<span className="sr-only"> (opens in a new tab)</span></a><small className={styles.url}>{asset.publicUrl}</small></> : <small>Private review: the image URL is not publicly accessible until approved.</small>}
          {review ? <div className="admin-media-review-summary"><strong>{review.metadata.privacyClass ?? "Reviewed"} · {review.metadata.consentStatus ?? "consent recorded"}</strong><small>Reviewed by {review.reviewer} on {review.createdAt.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })} (IST). {review.metadata.heroEligible ? "Hero eligible." : "Not approved as a hero asset."}</small></div> : asset.isPublic ? <div className="admin-media-review-summary"><strong>Legacy public asset — structured governance review pending</strong><small>This asset predates the structured consent/provenance gate. It remains visible to avoid silently breaking published pages, but should be re-reviewed before reuse or hero promotion.</small></div> : null}
          </div>
          {canEdit && <details className={styles.disclosure}><summary>Edit image details</summary><form action={updateMediaAsset} className="form-grid admin-media-edit"><input type="hidden" name="id" value={asset.id}/><input type="hidden" name="expectedUpdatedAt" value={asset.updatedAt.toISOString()}/><div className="field"><label htmlFor={`media-${asset.id}-title`}>Title</label><input id={`media-${asset.id}-title`} name="title" defaultValue={asset.title ?? ""} maxLength={160}/></div><div className="field"><label htmlFor={`media-${asset.id}-sourceYear`}>Source year</label><input id={`media-${asset.id}-sourceYear`} name="sourceYear" type="number" min="2000" max="2100" defaultValue={asset.sourceYear ?? ""}/></div><div className="field full"><label htmlFor={`media-${asset.id}-publicUrl`}>Public URL</label><input id={`media-${asset.id}-publicUrl`} name="publicUrl" defaultValue={asset.publicUrl ?? ""}/></div><div className="field full"><label htmlFor={`media-${asset.id}-altText`}>Alt text</label><input id={`media-${asset.id}-altText`} name="altText" defaultValue={asset.altText ?? ""} maxLength={300}/></div><div className="field full"><label htmlFor={`media-${asset.id}-caption`}>Caption</label><textarea id={`media-${asset.id}-caption`} name="caption" defaultValue={asset.caption ?? ""} maxLength={1000}/></div><div className="field"><label htmlFor={`media-${asset.id}-sourcePath`}>Source reference</label><input id={`media-${asset.id}-sourcePath`} name="sourcePath" defaultValue={asset.sourcePath ?? ""} maxLength={500}/></div><div className="field"><label htmlFor={`media-${asset.id}-sortOrder`}>Supporting-image order</label><input id={`media-${asset.id}-sortOrder`} name="sortOrder" type="number" min="0" defaultValue={asset.sortOrder === IDENTITY_MEDIA_SORT_ORDER ? 0 : asset.sortOrder}/></div><div className="field full"><label className="checkbox"><input type="checkbox" name="identityImage" defaultChecked={asset.kind === "IMAGE" && asset.sortOrder === IDENTITY_MEDIA_SORT_ORDER}/><span><strong>Identity / hero image</strong><small>Exactly one identity image should represent each drive or initiative.</small></span></label></div><div className="field full"><button className="button secondary" type="submit">Save metadata</button></div></form></details>}
          {canApprove && !asset.isPublic && <details className={styles.disclosure}><summary>Review and publish</summary><form action={setMediaPublication} className="form-grid admin-media-publish"><input type="hidden" name="id" value={asset.id}/><input type="hidden" name="publish" value="true"/><input type="hidden" name="expectedUpdatedAt" value={asset.updatedAt.toISOString()}/>
            <div className="field"><label htmlFor={`media-${asset.id}-privacyClass`}>Privacy classification</label><select id={`media-${asset.id}-privacyClass`} name="privacyClass" required defaultValue=""><option value="" disabled>Choose classification</option><option value="GREEN_PUBLIC">GREEN — approved public use</option><option value="AMBER_RESTRICTED">AMBER — restricted/contextual</option><option value="RED_PRIVATE">RED — private / do not publish</option></select></div>
            <div className="field"><label htmlFor={`media-${asset.id}-consentStatus`}>Consent status</label><select id={`media-${asset.id}-consentStatus`} name="consentStatus" required defaultValue=""><option value="" disabled>Choose consent status</option><option value="DOCUMENTED">Documented</option><option value="NOT_APPLICABLE">Not applicable</option><option value="RESTRICTED">Restricted</option><option value="NOT_APPROVED">Not approved</option></select></div>
            <div className="field full"><label className="checkbox"><input type="checkbox" name="provenanceConfirmed"/><span><strong>Source/provenance confirmed</strong><small>The programme/year/source association has been checked.</small></span></label></div>
            <div className="field full"><label className="checkbox"><input type="checkbox" name="websiteApproved"/><span><strong>Website is an approved usage channel</strong><small>Do not infer website permission from social-media publication alone.</small></span></label></div>
            <div className="field"><label className="checkbox"><input type="checkbox" name="containsMinor"/><span>Contains identifiable minor</span></label></div>
            <div className="field"><label className="checkbox"><input type="checkbox" name="containsPatient"/><span>Contains identifiable patient</span></label></div>
            <div className="field full"><label className="checkbox"><input type="checkbox" name="containsPrivateDocument"/><span><strong>Contains private document/data</strong><small>Checking this blocks publication.</small></span></label></div>
            <div className="field full"><label className="checkbox"><input type="checkbox" name="heroEligible"/><span><strong>Hero use approved</strong><small>Optional. Publication does not automatically make an asset suitable for high-prominence placement.</small></span></label></div>
            <div className="field full"><label htmlFor={`media-${asset.id}-reviewNotes`}>Review notes</label><textarea id={`media-${asset.id}-reviewNotes`} name="reviewNotes" maxLength={2000} placeholder="Consent source, crop restriction, provenance note or other publication context."/></div>
            <div className="field full"><button className="button" type="submit">Approve privacy gate & publish</button><small>AMBER/RED classifications, restricted consent, unconfirmed provenance, private documents, or child/patient media without documented consent will fail closed.</small></div>
          </form></details>}
          {canApprove && asset.isPublic && <details className={styles.disclosure}><summary>Unpublish image</summary><form action={setMediaPublication} className="admin-media-publish"><input type="hidden" name="id" value={asset.id}/><input type="hidden" name="publish" value="false"/><button className="text-button" type="submit">Unpublish</button></form></details>}
          {canApprove && !asset.isPublic && <details className={styles.disclosure}><summary>Delete unpublished record</summary><form action={deleteMediaAsset} className="form-grid admin-media-publish"><input type="hidden" name="id" value={asset.id}/><input type="hidden" name="expectedUpdatedAt" value={asset.updatedAt.toISOString()}/><div className="field full"><label htmlFor={`media-${asset.id}-confirm`}>Permanent deletion confirmation</label><input id={`media-${asset.id}-confirm`} name="confirm" required pattern="DELETE" placeholder="Type DELETE"/><small>Deletes the unpublished record and its Amaana-managed storage object. External source URLs are not modified.</small></div><div className="field full"><button className="text-button" type="submit">Delete unpublished media permanently</button></div></form></details>}
        </article>;
      })}</div>}
      <nav className="filter-row" aria-label="Media pagination">
        {pagination.hasPrevious && <Link href={pageHref(pagination.page - 1)}>Previous</Link>}
        <span>Page {pagination.page} of {pagination.totalPages} · {pagination.totalItems} records</span>
        {pagination.hasNext && <Link href={pageHref(pagination.page + 1)}>Next</Link>}
      </nav>
    </section>
  </>;
}