"use client";

import { useActionState, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

type ReviewResult = { message: string } & (
  { state: "idle" | "success" | "error" } | { status: "idle" | "success" | "error" }
);

/** Server-rendered controls remain slots; only action feedback and pending
 * submission controls belong in the client graph. Authorization stays in each action. */
export function AdminActionForm<T extends ReviewResult>({ action, initial, children, afterFeedback, messageClassName, announce = false }: {
  action: (previous: Awaited<T>, form: FormData) => Promise<T>;
  initial: Awaited<T>;
  children: ReactNode;
  afterFeedback?: ReactNode;
  messageClassName?: string;
  announce?: boolean;
}) {
  const [result, formAction, pending] = useActionState(action, initial);
  const status = "status" in result ? result.status : result.state;
  return <form action={formAction} className="form-grid" aria-busy={pending}>
    {children}
    {status !== "idle" && <p role={status === "error" ? "alert" : "status"}
      className={messageClassName} aria-live={announce ? status === "error" ? "assertive" : "polite" : undefined}>{result.message}</p>}
    {afterFeedback}
  </form>;
}

export function AdminActionButton({ children, pendingLabel, disabled, ...props }: ComponentProps<"button"> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return <button {...props} disabled={pending || disabled}>{pending && pendingLabel ? pendingLabel : children}</button>;
}
