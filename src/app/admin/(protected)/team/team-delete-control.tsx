type Props = {
  member: { id: string; fullName: string; designation: string; updatedAt: Date };
  action: (formData: FormData) => Promise<void>;
};

export function TeamDeleteControl({ member, action }: Props) {
  const dialogId = `team-delete-${member.id}`;
  const titleId = `${dialogId}-title`;
  const inputId = `${dialogId}-confirm`;
  return (
    <>
      <button type="button" className="text-button" popoverTarget={dialogId} popoverTargetAction="show" aria-label={`Remove member: ${member.fullName}, ${member.designation}`}>
        Remove member
      </button>
      <div
        id={dialogId}
        popover="auto"
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        style={{
          width: "min(28rem, calc(100vw - 2rem))",
          padding: "clamp(1.25rem, 3vw, 2rem)",
          border: "1px solid var(--af-color-blue-600)",
          background: "var(--af-color-surface)",
          color: "var(--af-color-text)",
        }}
      >
        <h3 id={titleId}>Remove {member.fullName}, {member.designation} from the directory?</h3>
        <p>This removes the public profile from the directory. A limited internal record remains for audit integrity. Type DELETE to confirm.</p>
        <form action={action} className="form-grid">
          <input type="hidden" name="id" value={member.id} />
          <input type="hidden" name="expectedUpdatedAt" value={member.updatedAt.toISOString()} />
          <div className="field full">
            <label htmlFor={inputId}>Confirmation</label>
            <input id={inputId} name="confirm" required pattern="DELETE" autoComplete="off" />
          </div>
          <div className="field full">
            <button className="button" type="submit">Remove from directory</button>
            <button className="text-button" type="button" popoverTarget={dialogId} popoverTargetAction="hide">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
