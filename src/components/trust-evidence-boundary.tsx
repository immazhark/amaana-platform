type TrustEvidenceBoundaryProps = {
  context: "impact" | "transparency";
};

const COPY = {
  impact: {
    eyebrow: "Evidence boundary",
    title: "What you can inspect here—and what stays private.",
    intro: "Amaana separates public accountability from the private material used to verify need. Published outcomes should remain understandable without exposing a person’s sensitive evidence.",
  },
  transparency: {
    eyebrow: "Public record · Private proofs",
    title: "Accountability does not require exposing private evidence.",
    intro: "Amaana’s public record is designed to show what can responsibly be verified in public while keeping identity, medical, financial and case-review material inside the private verification process.",
  },
} as const;

const EVIDENCE_ITEMS = [
  {
    label: "Public record",
    title: "Evidence that can be responsibly published",
    description: "Published initiative outcomes, public updates and website-approved media can support the public record when their publication and privacy gates are satisfied.",
  },
  {
    label: "Private verification",
    title: "Proofs that remain outside the public site",
    description: "Identity documents, medical records, bank or payment details, private assistance evidence and internal verification material are not public accountability content.",
  },
  {
    label: "Publication gate",
    title: "Public does not mean automatic",
    description: "A media or content record must meet its public-status and privacy-review requirements before the website can expose it. Missing or unapproved evidence stays out of the public presentation.",
  },
] as const;

export function TrustEvidenceBoundary({ context }: TrustEvidenceBoundaryProps) {
  const copy = COPY[context];
  const headingId = `trust-evidence-${context}`;

  return (
    <section aria-labelledby={headingId} data-trust-evidence-boundary={context}>
      <div className="v2-section-head">
        <div>
          <p className="v2-section-label">{copy.eyebrow}</p>
          <h2 className="v2-section-title" id={headingId}>{copy.title}</h2>
        </div>
        <p className="v2-section-intro">{copy.intro}</p>
      </div>
      <div className="grid stats">
        {EVIDENCE_ITEMS.map(item => (
          <article className="card" key={item.label}>
            <span className="eyebrow">{item.label}</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
