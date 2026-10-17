/**
 * Accept a single unambiguous text value for each applicant-owned field.
 * Documents are the only intentionally repeated multipart field and remain
 * validated separately as private evidence in the route.
 */
export const ASSISTANCE_TEXT_FIELDS = [
  "applicantName", "phone", "email", "city", "category", "description", "consent",
] as const;

export type AssistanceTextField = typeof ASSISTANCE_TEXT_FIELDS[number];

type InputResult =
  | { ok: true; fields: Partial<Record<AssistanceTextField, string>> }
  | { ok: false; field: AssistanceTextField; message: string };

export function parseUniqueAssistanceTextFields(form: FormData): InputResult {
  const fields: Partial<Record<AssistanceTextField, string>> = {};
  for (const field of ASSISTANCE_TEXT_FIELDS) {
    const entries = form.getAll(field);
    if (entries.length > 1) {
      return { ok: false, field, message: "Only one value is allowed for this field." };
    }
    const value = entries[0];
    if (value === undefined) continue;
    if (typeof value !== "string") {
      return { ok: false, field, message: "This field must contain text." };
    }
    fields[field] = value;
  }
  return { ok: true, fields };
}
