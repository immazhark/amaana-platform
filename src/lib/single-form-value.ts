/** Scalar action fields must not depend on first-value wins. Keep missing and
 * empty values unchanged so each domain retains its own required/optional rules.
 * Multi-file and explicitly repeated controls must use their own list parser.
 */
export function singleFormValue(form: FormData, name: string): FormDataEntryValue | null {
  const values = form.getAll(name);
  if (values.length > 1) throw new Error(`Repeated ${name} fields are not accepted.`);
  return values[0] ?? null;
}
