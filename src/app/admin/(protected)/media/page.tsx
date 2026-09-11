import { hasPermission, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createMediaAsset, setMediaPublication, updateMediaAsset } from "./actions";

export default async function AdminMediaPage() {
  const user = await requirePermission("content.view");
  const canEdit = hasPermission(user, "content.update");
  const canApprove = hasPermission(user, "content.approve");

  const [assets, causes, initiatives, stories, faith] = await Promise.all([
    prisma.mediaAsset.findMany({
      include: { cause: true, initiative: true, story: true, faithContent: true },
      orderBy: [{ isPublic: "asc" }, { sourceYear: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.cause.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.initiative.findMany({ orderBy: [{ startYear: "desc" }, { title: "asc" }], select: { id: true, title: true } }),
    prisma.story.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.faithContent.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);

  const targetLabel = (asset: (typeof assets)[number]) => asset.initiative?.title ?? asset.story?.title ?? asset.cause?.title ?? asset.faithContent?.title ?? "Unlinked";

  return <>
    <div className="admin-heading"><div><p className="eyebrow">Content evidence</p><h1>Media review</h1><p className="lead">Upload and document authentic Amaana material here. Nothing appears publicly until an approver explicitly publishes it.</p></div></div>

    {canEdit && <section className="admin-card" style={{ marginBottom: "2rem" }}>
      <h2>Add reviewed media</h2>
      <p className="muted">Use original campaign files where possible. Uploading creates an unpublished record first; publication is a separate approval action.</p>
      <form action={createMediaAsset} encType="multipart/form-data" className="form-grid">
        <div className="field full"><label htmlFor="target">Attach to</label><select id="target" name="target" required defaultValue=""><option value="" disabled>Select a cause, initiative, story or reflection</option><optgroup label="Initiatives">{initiatives.map(item => <option key={item.id} value={`initiative:${item.id}`}>{item.title}</option>)}</optgroup><optgroup label="Stories">{stories.map(item => <option key={item.id} value={`story:${item.id}`}>{item.title}</option>)}</optgroup><optgroup label="Causes">{causes.map(item => <option key={item.id} value={`cause:${item.id}`}>{item.title}</option>)}</optgroup><optgroup label="Faith & Reflections">{faith.map(item => <option key={item.id} value={`faith:${item.id}`}>{item.title}</option>)}</optgroup></select></div>
        <div className="field"><label htmlFor="mediaFile">File</label><input id="mediaFile" name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"/><small>JPEG, PNG, WebP or PDF · maximum 5 MB.</small></div>
        <div className="field"><label htmlFor="publicUrl">Existing public URL <span className="muted">optional</span></label><input id="publicUrl" name="publicUrl" placeholder="https://… or /media/…"/><small>Use this when the reviewed file is already hosted publicly.</small></div>
        <div className="field"><label htmlFor="title">Title</label><input id="title" name="title" maxLength={160}/></div>
        <div className="field"><label htmlFor="sourceYear">Source year</label><input id="sourceYear" name="sourceYear" type="number" min="2000" max="2100"/></div>
        <div className="field full"><label htmlFor="altText">Alt text</label><input id="altText" name="altText" maxLength={300}/><small>Required for images. Describe what is visibly present, not what you assume happened.</small></div>
        <div className="field full"><label htmlFor="caption">Caption</label><textarea id="caption" name="caption" maxLength={1000}/></div>
        <div className="field"><label htmlFor="sourcePath">Original source reference</label><input id="sourcePath" name="sourcePath" maxLength={500} placeholder="IMG_0138.jpg / archive path"/></div>
        <div className="field"><label htmlFor="sortOrder">Display order</label><input id="sortOrder" name="sortOrder" type="number" defaultValue="0"/></div>
        <div className="field full"><button className="button" type="submit">Create unpublished media record</button></div>
      </form>
    </section>}

    <section className="admin-card">
      <div className="admin-heading"><div><p className="eyebrow">Publication gate</p><h2>Media library</h2></div><span className="status-badge">{assets.length} records</span></div>
      {assets.length === 0 ? <p className="empty-state">No media records yet.</p> : <div className="admin-media-list">{assets.map(asset => <article className="admin-media-item" key={asset.id}>
        <div className="admin-media-summary"><div><span className="status-badge">{asset.isPublic ? "PUBLIC" : "PRIVATE REVIEW"}</span><small>{asset.kind.replaceAll("_", " ")} · {asset.sourceYear ?? "year not set"}</small></div><h3>{asset.title || asset.altText || asset.sourcePath || "Untitled media"}</h3><p>{targetLabel(asset)}</p>{asset.publicUrl ? <a href={asset.publicUrl} target="_blank" rel="noreferrer">Open public asset ↗</a> : <small>No public URL yet{asset.storageKey ? " — file is stored but needs S3_PUBLIC_BASE_URL or a reviewed URL" : ""}.</small>}</div>
        {canEdit && <form action={updateMediaAsset} className="form-grid admin-media-edit"><input type="hidden" name="id" value={asset.id}/><div className="field"><label>Title</label><input name="title" defaultValue={asset.title ?? ""} maxLength={160}/></div><div className="field"><label>Source year</label><input name="sourceYear" type="number" min="2000" max="2100" defaultValue={asset.sourceYear ?? ""}/></div><div className="field full"><label>Public URL</label><input name="publicUrl" defaultValue={asset.publicUrl ?? ""}/></div><div className="field full"><label>Alt text</label><input name="altText" defaultValue={asset.altText ?? ""} maxLength={300}/></div><div className="field full"><label>Caption</label><textarea name="caption" defaultValue={asset.caption ?? ""} maxLength={1000}/></div><div className="field"><label>Source reference</label><input name="sourcePath" defaultValue={asset.sourcePath ?? ""} maxLength={500}/></div><div className="field"><label>Display order</label><input name="sortOrder" type="number" defaultValue={asset.sortOrder}/></div><div className="field full"><button className="button secondary" type="submit">Save metadata</button></div></form>}
        {canApprove && <form action={setMediaPublication} className="admin-media-publish"><input type="hidden" name="id" value={asset.id}/><input type="hidden" name="publish" value={asset.isPublic ? "false" : "true"}/><button className={asset.isPublic ? "text-button" : "button"} type="submit">{asset.isPublic ? "Unpublish" : "Approve & publish"}</button>{!asset.isPublic && <small>Publication records privacy approval time and makes the asset eligible for public rendering.</small>}</form>}
      </article>)}</div>}
    </section>
  </>;
}
