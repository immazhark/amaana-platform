import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function singleText(formData: FormData, name: string): string {
  const values = formData.getAll(name);
  if (values.length > 1 || (values.length === 1 && typeof values[0] !== "string")) {
    throw new Error(`Provide a single text ${name} field.`);
  }
  return typeof values[0] === "string" ? values[0].trim() : "";
}

function checkbox(formData: FormData, name: string): boolean {
  const values = formData.getAll(name);
  if (values.length === 0) return false;
  if (values.length !== 1 || values[0] !== "on") {
    throw new Error(`Choose a valid ${name} checkbox.`);
  }
  return true;
}

export function singleTeamId(formData: FormData, name = "id") {
  const value = singleText(formData, name);
  if (!value || value.length > 128) throw new Error(`Invalid ${name}.`);
  return value;
}

export function slugFromTeamName(name: string) {
  return name.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function optional(value: string) { return value.length > 0 ? value : null; }

const memberSchema = z.object({
  slug: z.string().min(2).max(100).regex(slugPattern, "Use a lowercase hyphenated slug."),
  fullName: z.string().min(2).max(120),
  designation: z.string().min(2).max(120),
  groupId: z.string().min(1).max(128),
  bio: z.string().max(300).nullable(),
  photoAlt: z.string().max(200).nullable(),
  linkedinUrl: z.string().nullable(),
  email: z.string().email().max(254).nullable(),
  isPublished: z.boolean(),
});

export function parseTeamMemberForm(formData: FormData) {
  const fullName = singleText(formData, "fullName");
  const requestedSlug = singleText(formData, "slug");
  const linkedinUrl = optional(singleText(formData, "linkedinUrl"));
  if (linkedinUrl) {
    try {
      const url = new URL(linkedinUrl);
      if (url.protocol !== "https:" || url.username || url.password ||
        !(url.hostname === "linkedin.com" || url.hostname.endsWith(".linkedin.com"))) {
        throw new Error("LinkedIn URL must use HTTPS on linkedin.com.");
      }
    } catch {
      throw new Error("LinkedIn URL must use HTTPS on linkedin.com.");
    }
  }
  const raw = {
    slug: requestedSlug || slugFromTeamName(fullName),
    fullName,
    designation: singleText(formData, "designation"),
    groupId: singleText(formData, "groupId"),
    bio: optional(singleText(formData, "bio")),
    photoAlt: optional(singleText(formData, "photoAlt")),
    linkedinUrl,
    email: optional(singleText(formData, "email")),
    isPublished: checkbox(formData, "isPublished"),
  };
  const result = memberSchema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    if (!issue) throw new Error("Invalid team input.");
    throw new Error(`Invalid ${issue.path.join(".")}: ${issue.message}`);
  }
  return result.data;
}

const groupSchema = z.object({
  key: z.string().regex(/^[A-Z][A-Z0-9_]*$/).min(2).max(64),
  title: z.string().min(2).max(100),
  description: z.string().max(240).nullable(),
});

export function parseTeamGroupForm(formData: FormData) {
  const raw = {
    key: singleText(formData, "key").toUpperCase().replace(/[- ]+/g, "_"),
    title: singleText(formData, "title"),
    description: optional(singleText(formData, "description")),
  };
  const result = groupSchema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    if (!issue) throw new Error("Invalid team input.");
    throw new Error(`Invalid ${issue.path.join(".")}: ${issue.message}`);
  }
  return result.data;
}

export function parseTeamCommand(formData: FormData) {
  const id = singleTeamId(formData);
  const direction = singleText(formData, "direction");
  if (direction !== "up" && direction !== "down") throw new Error("Invalid team sort direction.");
  return { id, direction };
}

export function teamEditVersion(formData: FormData) {
  const value = singleText(formData, "expectedUpdatedAt");
  const parsed = new Date(value);
  if (!value || Number.isNaN(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new Error("Team record changed. Refresh before editing.");
  }
  return parsed;
}

export function teamPhotoInput(formData: FormData) {
  const values = formData.getAll("photo");
  if (values.length > 1 || (values.length === 1 && !(values[0] instanceof File))) {
    throw new Error("Provide a single team photo file.");
  }
  const file = values[0] instanceof File && values[0].size > 0 ? values[0] : null;
  const consent = checkbox(formData, "photoConsent");
  const removePhoto = checkbox(formData, "removePhoto");
  if (file && !consent) throw new Error("Photograph publication requires the member's consent.");
  if (file && removePhoto) throw new Error("Choose upload or removal, not both.");
  if (file) assertTeamPhoto(file);
  return { file, removePhoto };
}

export function assertTeamPhoto(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Team photographs must be JPEG, PNG or WebP.");
  }
  if (file.size <= 0 || file.size > 2 * 1024 * 1024) {
    throw new Error("Team photographs must be between 1 byte and 2 MB.");
  }
}


export function assertTeamPhotoContent(bytes: Uint8Array, mime: string) {
  const jpeg = mime === "image/jpeg" && bytes.length >= 3 &&
    bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = mime === "image/png" && bytes.length >= 8 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  const webp = mime === "image/webp" && bytes.length >= 12 &&
    [82, 73, 70, 70].every((value, index) => bytes[index] === value) &&
    [87, 69, 66, 80].every((value, index) => bytes[index + 8] === value);

  if (!jpeg && !png && !webp) {
    throw new Error("Photograph file signature does not match the declared image type.");
  }
}
