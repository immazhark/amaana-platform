"use client";

import { useActionState, type ReactNode } from "react";
import type { AdminActionFeedback } from "@/app/admin/(protected)/requests/[id]/actions";

const initialState: AdminActionFeedback = { kind: "idle", message: "" };

export function AdminActionFeedbackForm({
  action,
  children,
}: {
  action: (previous: AdminActionFeedback, data: FormData) => Promise<AdminActionFeedback>;
  children: ReactNode;
}) {
  const [result, formAction, pending] = useActionState(action, initialState);
  return <form action={formAction} className="field" aria-busy={pending}>
    {children}
    {result.kind === "error" && <p className="form-error" role="alert">{result.message}</p>}
    {result.kind === "success" && <p role="status" aria-live="polite">{result.message}</p>}
  </form>;
}
