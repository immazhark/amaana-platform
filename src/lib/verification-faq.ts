import { serializeStructuredData } from "@/lib/structured-data";

/** These answers must remain identical in visible copy and machine-readable
 * metadata. No private beneficiary evidence, unverifiable totals or claims
 * of an official tax certificate. Update only after editorial review. */
export const VERIFICATION_FAQ = [
  {
    question: "How does Amaana review a request for assistance?",
    answer: "Amaana receives a request, considers the information and supporting evidence privately, and determines what assistance can responsibly be offered. A request does not automatically become a public fundraising appeal.",
  },
  {
    question: "Does an appeal reveal the beneficiary's private documents?",
    answer: "No. Public appeals share only approved context and progress. Identity records, medical documents, financial evidence and internal review material are kept outside the public website.",
  },
  {
    question: "When does a direct UPI or bank transfer count toward an appeal?",
    answer: "A claimed direct transfer remains pending until Amaana checks the transaction reference and exact credited amount against its own received bank record. A donor-submitted screenshot or UTR alone is not confirmation of receipt.",
  },
  {
    question: "Can Amaana accept donations from outside India?",
    answer: "No. Amaana Foundation is not FCRA-registered and currently accepts domestic Indian contributions only through supported methods.",
  },
  {
    question: "Is a normal donation acknowledgement an official Section 80G certificate?",
    answer: "No. A normal donation acknowledgement is not a statutory Form 10BE certificate and does not by itself establish eligibility for a Section 80G deduction. Amaana's current 12A/12AB and 80G approvals are provisional.",
  },
] as const;

export function buildVerificationFaqSchema(siteUrl: string) {
  const url = new URL("/how-we-verify", siteUrl).toString();
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${url}#questions`,
    url,
    inLanguage: "en-IN",
    isPartOf: { "@id": `${new URL("/", siteUrl).toString()}#website` },
    mainEntity: VERIFICATION_FAQ.map(item => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function serializeVerificationFaqSchema(siteUrl: string) {
  return serializeStructuredData(buildVerificationFaqSchema(siteUrl));
}
