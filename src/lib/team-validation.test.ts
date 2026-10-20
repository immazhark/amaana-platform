import { describe, expect, it } from "vitest";
import { parseTeamMemberForm, parseTeamGroupForm, assertTeamPhoto, assertTeamPhotoContent, teamPhotoInput } from "./team-validation";

function memberForm() {
  const form = new FormData();
  form.set("fullName", "Mohammed Ismail Khan");
  form.set("designation", "Chartered Accountant");
  form.set("slug", "mohammed-ismail-khan-ca");
  form.set("groupId", "group_finance");
  form.set("isPublished", "on");
  return form;
}

describe("team member form boundary", () => {
  it("keeps the two Mohammed Ismail Khan records distinct by slug", () => {
    const ca = parseTeamMemberForm(memberForm());
    const webForm = memberForm();
    webForm.set("slug", "mohammed-ismail-khan-web");
    webForm.set("designation", "Web Developer");
    const web = parseTeamMemberForm(webForm);
    expect(ca.slug).not.toBe(web.slug);
    expect(ca.fullName).toBe(web.fullName);
    expect(web.designation).toBe("Web Developer");
  });

  it("rejects duplicate or file-valued scalar fields before database mutations", () => {
    const repeated = memberForm();
    repeated.append("isPublished", "on");
    expect(() => parseTeamMemberForm(repeated)).toThrow(/single|checkbox/i);
    const file = memberForm();
    file.set("fullName", new File(["invalid"], "name.txt"));
    expect(() => parseTeamMemberForm(file)).toThrow(/text/i);
  });

  it("generates slugs but never deduplicates people by their full name", () => {
    const form = memberForm();
    form.delete("slug");
    expect(parseTeamMemberForm(form).slug).toBe("mohammed-ismail-khan");
  });

  it("rejects untrusted LinkedIn destinations, malformed email and overlong biographies", () => {
    const form = memberForm();
    form.set("linkedinUrl", "https://linkedin.com.evil.example/profile");
    expect(() => parseTeamMemberForm(form)).toThrow(/LinkedIn/i);
    form.set("linkedinUrl", "https://www.linkedin.com/in/example");
    form.set("email", "bad\n@example.com");
    expect(() => parseTeamMemberForm(form)).toThrow(/email/i);
    form.set("email", "person@example.org");
    form.set("bio", "X".repeat(301));
    expect(() => parseTeamMemberForm(form)).toThrow(/bio/i);
  });

  it("requires exact native checkbox values and accepts empty optional fields", () => {
    const form = memberForm();
    form.set("isPublished", "true");
    expect(() => parseTeamMemberForm(form)).toThrow(/checkbox/i);
    form.delete("isPublished");
    const parsed = parseTeamMemberForm(form);
    expect(parsed.isPublished).toBe(false);
    expect(parsed.bio).toBeNull();
    expect(parsed.email).toBeNull();
  });

  it("fails closed on photo uploads without member consent", () => {
    const form = new FormData();
    form.set("photo", new File(["sample"], "member.jpg", { type: "image/jpeg" }));
    expect(() => teamPhotoInput(form)).toThrow(/consent/i);
    form.set("photoConsent", "on");
    expect(teamPhotoInput(form).file).toBeInstanceOf(File);
  });

  it("keeps a blank native file control optional", () => {
    const absent = new FormData();
    absent.set("photo", new File([], "", { type: "application/octet-stream" }));
    expect(teamPhotoInput(absent)).toEqual({ file: null, removePhoto: false });
    expect(teamPhotoInput(new FormData())).toEqual({ file: null, removePhoto: false });
  });

  it("rejects a selected zero-byte portrait instead of silently omitting it", () => {
    const form = new FormData();
    form.set("photo", new File([], "portrait.webp", { type: "image/webp" }));
    form.set("photoConsent", "on");
    expect(() => teamPhotoInput(form)).toThrow(/between 1 byte and 2 MB/i);
  });

  it("rejects an empty selected portrait even when removal is requested", () => {
    const form = new FormData();
    form.set("photo", new File([], "portrait.png", { type: "image/png" }));
    form.set("photoConsent", "on");
    form.set("removePhoto", "on");
    expect(() => teamPhotoInput(form)).toThrow(/upload or removal/i);
  });

  it("accepts only JPEG, PNG, WebP and at most two megabytes for photographs", () => {
    const pdf = new File(["pdf"], "portrait.pdf", { type: "application/pdf" });
    expect(() => assertTeamPhoto(pdf)).toThrow(/JPEG|PNG|WebP/);
    const big = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "portrait.jpg", { type: "image/jpeg" });
    expect(() => assertTeamPhoto(big)).toThrow(/2 MB/);
    expect(() => assertTeamPhoto(new File(["small"], "portrait.webp", { type: "image/webp" }))).not.toThrow();
  });
  it("rejects spoofed portrait bytes even when the declared MIME type is allowed", () => {
    const fakeJpeg = new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'></svg>");
    expect(() => assertTeamPhotoContent(fakeJpeg, "image/jpeg")).toThrow(/signature/i);
    const pngSignature = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(() => assertTeamPhotoContent(pngSignature, "image/jpeg")).toThrow(/signature/i);
    expect(() => assertTeamPhotoContent(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x4e, 0x4f, 0x50, 0x45]), "image/webp")).toThrow(/signature/i);
  });

  it("accepts valid JPEG, PNG and WebP file signatures for further decoding", () => {
    expect(() => assertTeamPhotoContent(Uint8Array.from([0xff, 0xd8, 0xff]), "image/jpeg")).not.toThrow();
    expect(() => assertTeamPhotoContent(Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]), "image/png")).not.toThrow();
    expect(() => assertTeamPhotoContent(Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]), "image/webp")).not.toThrow();
  });

});

describe("team group form boundary", () => {
  it("normalizes a new group key and validates required title", () => {
    const form = new FormData();
    form.set("key", "community-partners");
    form.set("title", "Community Partners");
    expect(parseTeamGroupForm(form).key).toBe("COMMUNITY_PARTNERS");
    form.set("title", "");
    expect(() => parseTeamGroupForm(form)).toThrow(/title/i);
  });
});
