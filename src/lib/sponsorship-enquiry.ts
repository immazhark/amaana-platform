/** Fixed-category preparation only. No student inventory, financial promise,
 * personal record or message submission is created here. */
export const SPONSORSHIP_PATHS = {
  hifdh: "Hifdh education",
  nazira: "Qur’an Nazira education",
  school: "School education (developing pathway)",
  college: "College education (developing pathway)",
  discuss: "Discuss available education needs",
} as const;
export const SPONSORSHIP_SUPPORT = {
  discuss: "Discuss the available support arrangements",
  once: "Interested in one contribution, subject to reviewed need",
  ongoing: "Interested in ongoing support, with each contribution decided separately",
} as const;
export type SponsorshipEnquiry = {
  path: keyof typeof SPONSORSHIP_PATHS;
  support: keyof typeof SPONSORSHIP_SUPPORT;
  privateName: boolean;
};

export function parseSponsorshipEnquiry(input: Record<string, string | string[] | undefined>): SponsorshipEnquiry | null {
  if (Object.keys(input).some(key => !["path", "support", "privateName"].includes(key))) return null;
  const { path, support, privateName } = input;
  if (typeof path !== "string" || !Object.hasOwn(SPONSORSHIP_PATHS, path)
    || typeof support !== "string" || !Object.hasOwn(SPONSORSHIP_SUPPORT, support)
    || (privateName !== undefined && privateName !== "yes")) return null;
  return { path: path as SponsorshipEnquiry["path"], support: support as SponsorshipEnquiry["support"], privateName: privateName === "yes" };
}

export function buildSponsorshipEnquiry(enquiry: SponsorshipEnquiry) {
  const checked = parseSponsorshipEnquiry({ path: enquiry.path, support: enquiry.support, privateName: enquiry.privateName ? "yes" : undefined });
  if (!checked) throw new RangeError("Unsupported sponsorship preferences");
  const subject = "Amaana Taleem - Education sponsorship enquiry";
  const body = [
    "Assalamu alaikum Amaana team,", "",
    `Education interest: ${SPONSORSHIP_PATHS[checked.path]}`,
    `Support preference: ${SPONSORSHIP_SUPPORT[checked.support]}`,
    ...(checked.privateName ? ["Please keep my name out of public recognition. I understand financial and receipt records may still require my details."] : []),
    "", "Please confirm whether a reviewed need is available, the scope and cost, how support would be used, and which privacy-safe updates can be shared before I decide.",
    "I understand this enquiry does not reserve a student placement or authorize a payment or recurring charge.",
    "I will not include student names, identity documents, bank details or other sensitive records in this enquiry.",
  ].join("\n");
  return { body, href: `mailto:amaanafoundation24@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` };
}
