import type { TeamGroup, TeamMember } from "@prisma/client";

type Props = { groups: TeamGroup[]; member?: TeamMember };

export function TeamMemberFields({ groups, member }: Props) {
  const prefix = member?.id ?? "new";
  return (
    <div className="form-grid">
      <div className="field">
        <label htmlFor={`${prefix}-name`}>Full name</label>
        <input id={`${prefix}-name`} name="fullName" required maxLength={120} defaultValue={member?.fullName ?? ""} />
      </div>
      <div className="field">
        <label htmlFor={`${prefix}-designation`}>Designation</label>
        <input id={`${prefix}-designation`} name="designation" required maxLength={120} defaultValue={member?.designation ?? ""} />
      </div>
      <div className="field">
        <label htmlFor={`${prefix}-slug`}>Unique slug (leave blank to derive from the name)</label>
        <input id={`${prefix}-slug`} name="slug" maxLength={100} defaultValue={member?.slug ?? ""} pattern="[a-z0-9]+(-[a-z0-9]+)*" />
      </div>
      <div className="field">
        <label htmlFor={`${prefix}-group`}>Team group</label>
        <select id={`${prefix}-group`} name="groupId" required defaultValue={member?.groupId ?? groups[0]?.id ?? ""}>
          {groups.map(group => <option value={group.id} key={group.id}>{group.title}</option>)}
        </select>
      </div>
      <div className="field full">
        <label htmlFor={`${prefix}-bio`}>Short bio (optional, up to 300 characters)</label>
        <textarea id={`${prefix}-bio`} name="bio" rows={2} maxLength={300} defaultValue={member?.bio ?? ""} />
      </div>
      <div className="field">
        <label htmlFor={`${prefix}-linkedin`}>LinkedIn HTTPS profile (optional)</label>
        <input id={`${prefix}-linkedin`} name="linkedinUrl" type="url" defaultValue={member?.linkedinUrl ?? ""} />
      </div>
      <div className="field">
        <label htmlFor={`${prefix}-email`}>Public contact email (optional)</label>
        <input id={`${prefix}-email`} name="email" type="email" defaultValue={member?.email ?? ""} />
      </div>
      <div className="field">
        <label htmlFor={`${prefix}-photo`}>Member portrait (JPEG / PNG / WebP, max 2 MB)</label>
        <input id={`${prefix}-photo`} name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
      </div>
      <div className="field">
        <label htmlFor={`${prefix}-photoAlt`}>Portrait description (optional)</label>
        <input id={`${prefix}-photoAlt`} name="photoAlt" maxLength={200} defaultValue={member?.photoAlt ?? ""} />
      </div>
      <div className="field full">
        <label><input type="checkbox" name="photoConsent" /> I confirm the team member consented to public use of the newly uploaded photograph.</label>
        {member?.photoStorageKey ? <label><input type="checkbox" name="removePhoto" /> Remove the current public photograph</label> : null}
        <label><input type="checkbox" name="isPublished" defaultChecked={member?.isPublished ?? true} /> Publish this member in the public directory</label>
      </div>
    </div>
  );
}
