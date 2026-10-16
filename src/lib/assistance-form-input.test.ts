import { describe, expect, it } from "vitest";
import { parseUniqueAssistanceTextFields } from "./assistance-form-input";

const validForm = () => {
  const form = new FormData();
  form.set("applicantName", "Sample Applicant");
  form.set("phone", "9876543210");
  form.set("email", "");
  form.set("city", "Hyderabad");
  form.set("category", "EDUCATION");
  form.set("description", "A private assistance case needing a carefully reviewed decision.");
  form.set("consent", "on");
  return form;
};

describe("unambiguous assistance multipart field projection", () => {
  it("projects exactly one text value per applicant field", () => {
    expect(parseUniqueAssistanceTextFields(validForm())).toEqual({
      ok: true,
      fields: {
        applicantName: "Sample Applicant", phone: "9876543210", email: "",
        city: "Hyderabad", category: "EDUCATION",
        description: "A private assistance case needing a carefully reviewed decision.",
        consent: "on",
      },
    });
  });
  it.each(["applicantName", "phone", "email", "city", "category", "description", "consent"])(
    "rejects repeated %s fields instead of silently selecting the last value", field => {
      const form = validForm();
      form.append(field, "tampered");
      expect(parseUniqueAssistanceTextFields(form)).toEqual({
        ok: false, field, message: "Only one value is allowed for this field.",
      });
    },
  );
  it("permits omitted optional email and lets the schema validate missing required controls", () => {
    const form = validForm();
    form.delete("email");
    form.delete("consent");
    const result = parseUniqueAssistanceTextFields(form);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fields.email).toBeUndefined();
      expect(result.fields.consent).toBeUndefined();
    }
  });
  it("permits repeated evidence entries, but never treats them as text input", () => {
    const form = validForm();
    form.append("documents", "first");
    form.append("documents", "second");
    const result = parseUniqueAssistanceTextFields(form);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.fields).not.toHaveProperty("documents");
  });
});
