"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode, type FormEvent } from "react";

import type { ReviewFeedback } from "@/app/admin/(protected)/requests/[id]/approval-actions";

/** Reviews the actual form values in memory before the existing, version-guarded server action runs. */
export function ApprovalCheckAnswers({ children, approveAction, saveAction }: {
  children: ReactNode;
  approveAction: (previous: ReviewFeedback, data: FormData) => Promise<ReviewFeedback>;
  saveAction: (previous: ReviewFeedback, data: FormData) => Promise<ReviewFeedback>;
}) {
  const root = useRef<HTMLDivElement>(null);
  const reviewForm = useRef<HTMLFormElement | null>(null);
  const modal = () => root.current?.querySelector<HTMLDialogElement>("dialog");
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<ReviewFeedback>({ kind: "idle", message: "" });
  useEffect(() => {
    // Fail closed until the review interaction is available. Saving progress and rejecting still work without JS.
    const button = root.current?.querySelector<HTMLButtonElement>("[data-review-approval]");
    if (button) button.disabled = pending;
  });
  useEffect(() => {
    for (const control of root.current?.querySelectorAll<HTMLElement>("[data-review-error]") ?? []) {
      control.removeAttribute("aria-invalid");
      const hints = (control.getAttribute("aria-describedby") ?? "").split(" ").filter(id => !id.endsWith("-inline-error")).join(" ");
      if (hints) control.setAttribute("aria-describedby", hints); else control.removeAttribute("aria-describedby");
      control.removeAttribute("data-review-error");
    }
    for (const { field } of feedback.fields ?? []) {
      const control = root.current?.querySelector<HTMLElement>(`[id="${field}"]`);
      if (control) {
        control.setAttribute("aria-invalid", "true");
        control.setAttribute("data-review-error", "");
        control.setAttribute("aria-describedby", [control.getAttribute("aria-describedby"), `${field}-inline-error`].filter(Boolean).join(" "));
      }
    }
    if (feedback.kind === "error") root.current?.querySelector<HTMLElement>("#approval-inline-errors")?.focus();
  }, [feedback]);
  function review(event: FormEvent<HTMLDivElement>) {
    const button = (event.nativeEvent as SubmitEvent).submitter;
    if (!(button instanceof HTMLButtonElement)) return;
    if (button.hasAttribute("data-save-review-progress")) {
      event.preventDefault();
      const form = button.form;
      if (form && !pending) startTransition(async () => setFeedback(await saveAction(feedback, new FormData(form))));
      return;
    }
    if (!button.hasAttribute("data-review-approval")) return;
    event.preventDefault();
    if (pending) return;
    const form = button.form;
    if (!form) return;
    const data = new FormData(form);
    for (const answer of root.current?.querySelectorAll<HTMLElement>("[data-review-field]") ?? []) {
      const name = answer.dataset.reviewField!;
      const control = form.elements.namedItem(name);
      answer.textContent = control instanceof HTMLSelectElement ? control.selectedOptions[0]?.textContent ?? "Not selected"
        : control instanceof HTMLInputElement && control.type === "checkbox" ? (control.checked ? "Yes" : "No")
        : String(data.get(name) ?? "").trim() || "Not entered";
    }
    reviewForm.current = form;
    modal()?.showModal();
    modal()?.querySelector<HTMLElement>("h3")?.focus();
    if (modal()) modal()!.scrollTop = 0;
  }
  function choose(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("[data-review-cancel]")) modal()?.close();
    if (target.closest("[data-review-confirm]") && !pending && reviewForm.current) {
      const data = new FormData(reviewForm.current);
      modal()?.close();
      startTransition(async () => setFeedback(await approveAction(feedback, data)));
    }
  }
  return <div ref={root} onSubmitCapture={review} onClickCapture={choose}>
    {children}
    {pending && <p role="status">Saving review…</p>}
    {feedback.kind !== "idle" && <div id={feedback.kind === "error" ? "approval-inline-errors" : undefined} tabIndex={-1} role={feedback.kind === "error" ? "alert" : "status"}>
      <p>{feedback.message}</p>
      {feedback.fields?.length ? <ul>{feedback.fields.map(({ field, message }) => <li key={field + message}><a id={`${field}-inline-error`} href={`#${field}`}>{message}</a></li>)}</ul> : null}
    </div>}
    <noscript><p>Enable JavaScript to review the approval summary. You can still save progress or reject a request.</p></noscript>
  </div>;
}
