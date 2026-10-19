"use client";

import { useRef } from "react";

type Props = {
  member: { id: string; fullName: string; updatedAt: Date };
  action: (formData: FormData) => Promise<void>;
};

export function TeamDeleteControl({ member, action }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className="text-button" onClick={() => dialog.current?.showModal()}>Remove member</button>
      <dialog ref={dialog} aria-labelledby={`team-delete-${member.id}`} onClose={() => undefined}>
        <h3 id={`team-delete-${member.id}`}>Remove {member.fullName}?</h3>
        <p>This permanently removes this person's directory record. Type DELETE to confirm.</p>
        <form action={action} className="form-grid">
          <input type="hidden" name="id" value={member.id} />
          <input type="hidden" name="expectedUpdatedAt" value={member.updatedAt.toISOString()} />
          <div className="field full">
            <label htmlFor={`team-delete-confirm-${member.id}`}>Confirmation</label>
            <input id={`team-delete-confirm-${member.id}`} name="confirm" required pattern="DELETE" autoComplete="off" />
          </div>
          <div className="field full">
            <button className="button" type="submit">Remove permanently</button>
            <button className="text-button" type="button" onClick={() => dialog.current?.close()}>Cancel</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
