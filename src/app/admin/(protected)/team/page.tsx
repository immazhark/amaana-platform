import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TeamMemberFields } from "./team-member-fields";
import { TeamDeleteControl } from "./team-delete-control";
import {
  createTeamGroup, updateTeamGroup, reorderTeamGroup,
  createTeamMember, updateTeamMember, deleteTeamMember, reorderTeamMember,
} from "./actions";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ notice?: string; error?: string }> };

export default async function TeamAdminPage({ searchParams }: Props) {
  await requirePermission("content.update");
  const { notice, error } = await searchParams;
  const groups = await prisma.teamGroup.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: { members: { where: { deletedAt: null }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] } },
  });
  return (
    <>
      <div className="admin-heading">
        <div><p className="eyebrow">Public content · Team</p><h1>Team directory</h1>
        <p className="lead">Maintain trustees and other team members separately. Only published records appear on /team. A portrait requires recorded consent.</p></div>
      </div>
      {notice ? <p role="status" className="status-badge" style={{ marginBottom: "1rem" }}>{notice}</p> : null}
      {error ? <p role="alert" style={{ color: "var(--af-color-error)", marginBottom: "1rem" }}>{error}</p> : null}
      <section className="admin-card" style={{ marginBottom: "2rem" }}>
        <h2>Add a team member</h2>
        {groups.length ? (
          <form action={createTeamMember} encType="multipart/form-data">
            <TeamMemberFields groups={groups} />
            <button className="button" type="submit">Add member</button>
          </form>
        ) : <p>Add a team group first.</p>}
      </section>
      <section className="admin-card" style={{ marginBottom: "2rem" }}>
        <h2>Add a group</h2>
        <p>Group keys are unique; the title and descriptor appear on the public page.</p>
        <form action={createTeamGroup} className="form-grid">
          <div className="field"><label htmlFor="new-group-key">Unique key</label><input id="new-group-key" name="key" required maxLength={64} placeholder="COMMUNITY_PARTNERS" /></div>
          <div className="field"><label htmlFor="new-group-title">Group title</label><input id="new-group-title" name="title" required maxLength={100} /></div>
          <div className="field full"><label htmlFor="new-group-description">Description</label><textarea id="new-group-description" name="description" maxLength={240} rows={2} /></div>
          <div className="field full"><button className="button" type="submit">Add group</button></div>
        </form>
      </section>

      {groups.map((group, groupIndex) => (
        <section className="admin-card" aria-labelledby={`admin-team-group-${group.id}`} key={group.id} style={{ marginBottom: "2rem" }}>
          <div className="admin-heading">
            <div><p className="eyebrow">Group {groupIndex + 1}</p><h2 id={`admin-team-group-${group.id}`}>{group.title}</h2>
            {group.description ? <p>{group.description}</p> : null}</div>
            <form action={reorderTeamGroup} style={{ display: "flex", gap: ".5rem" }}>
              <input type="hidden" name="id" value={group.id} />
              <button type="submit" name="direction" value="up" disabled={groupIndex === 0} aria-label={`Move ${group.title} earlier`}>↑</button>
              <button type="submit" name="direction" value="down" disabled={groupIndex === groups.length - 1} aria-label={`Move ${group.title} later`}>↓</button>
            </form>
          </div>
          <details style={{ marginBottom: "1.5rem" }}>
            <summary>Update group title or description</summary>
            <form action={updateTeamGroup} className="form-grid">
              <input type="hidden" name="id" value={group.id} />
              <input type="hidden" name="expectedUpdatedAt" value={group.updatedAt.toISOString()} />
              <div className="field"><label htmlFor={`group-key-${group.id}`}>Unique key</label><input id={`group-key-${group.id}`} name="key" defaultValue={group.key} required maxLength={64} /></div>
              <div className="field"><label htmlFor={`group-title-${group.id}`}>Title</label><input id={`group-title-${group.id}`} name="title" defaultValue={group.title} required maxLength={100} /></div>
              <div className="field full"><label htmlFor={`group-description-${group.id}`}>Description</label><textarea id={`group-description-${group.id}`} name="description" defaultValue={group.description ?? ""} maxLength={240} rows={2} /></div>
              <button className="button" type="submit">Save group</button>
            </form>
          </details>
          {group.members.length ? (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {group.members.map((member, index) => (
                <li key={member.id} style={{ borderTop: "1px solid var(--af-color-border)", paddingBlock: "1rem" }}>
                  <div className="admin-heading">
                    <div>
                      <h3>{member.fullName}</h3>
                      <p>{member.designation}</p>
                      <span className="status-badge">{member.isPublished ? "Published" : "Hidden"}</span>
                    </div>
                    <form action={reorderTeamMember} style={{ display: "flex", gap: ".5rem" }}>
                      <input type="hidden" name="id" value={member.id} />
                      <button name="direction" value="up" disabled={index === 0} aria-label={`Move ${member.fullName}, ${member.designation}, earlier`}>↑</button>
                      <button name="direction" value="down" disabled={index === group.members.length - 1} aria-label={`Move ${member.fullName}, ${member.designation}, later`}>↓</button>
                    </form>
                  </div>
                  <details>
                    <summary>Edit member</summary>
                    <form action={updateTeamMember} encType="multipart/form-data" style={{ paddingBlock: "1rem" }}>
                      <input type="hidden" name="id" value={member.id} />
                      <input type="hidden" name="expectedUpdatedAt" value={member.updatedAt.toISOString()} />
                      <TeamMemberFields groups={groups} member={member} />
                      <button className="button" type="submit">Save member</button>
                    </form>
                  </details>
                  <TeamDeleteControl member={member} action={deleteTeamMember} />
                </li>
              ))}
            </ul>
          ) : <p className="muted">No members in this group.</p>}
        </section>
      ))}
    </>
  );
}
