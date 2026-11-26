export type AssistanceStep = 1 | 2 | 3 | 4;
const steps = [1, 2, 3, 4] as const;

/** Validate every intermediate step before a forward jump, stopping at the first error. */
export function firstInvalidAssistanceStep(from: AssistanceStep, to: AssistanceStep, validate: (step: AssistanceStep) => boolean): AssistanceStep | null {
  return steps.find(step => step >= from && step < to && !validate(step)) ?? null;
}

/** RadioNodeList is not focusable; focus its selected radio or the first available radio. */
export function assistanceFieldFocusTarget(form: HTMLFormElement, field: string) {
  if (field === "beneficiaryResidence") {
    return form.querySelector<HTMLInputElement>('input[name="beneficiaryResidence"]:checked')
      ?? form.querySelector<HTMLInputElement>('input[name="beneficiaryResidence"]');
  }
  return form.elements.namedItem(field);
}
