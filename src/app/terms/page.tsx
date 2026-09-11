import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms governing use of the Amaana Foundation platform.",
  alternates: { canonical: "/terms" },
  openGraph: { type: "website", url: "/terms", title: "Terms of Use | Amaana Foundation", description: "Terms governing use of the Amaana Foundation platform." },
  twitter: { card: "summary", title: "Terms of Use | Amaana Foundation", description: "Terms governing use of the Amaana Foundation platform." },
};
const sections=[
["01","Platform purpose",<>The platform provides information about Amaana Foundation, receives assistance requests and enables domestic donations to approved appeals.</>],
["02","No guaranteed assistance",<>Submitting a request does not guarantee verification, approval, publication, funding or assistance. Decisions depend on available information, resources and the organization&apos;s review.</>],
["03","Accurate information",<>Applicants and donors must provide accurate information and must not impersonate another person, submit misleading evidence, interfere with the platform or attempt unauthorized access.</>],
["04","Appeal information",<>Amaana takes reasonable steps to verify appeals, but circumstances may change and verification cannot eliminate every risk. Public information may be updated, paused or removed when necessary.</>],
["05","Payments",<>Domestic INR payments are processed by Razorpay and may also be subject to its terms. A payment is treated as received only after successful server-side confirmation.</>],
["06","Availability",<>The platform may be changed, suspended or temporarily unavailable for maintenance, security or operational reasons.</>],
["07","Contact",<>Questions about these terms may be sent to <a href="mailto:amaanafoundation24@gmail.com">amaanafoundation24@gmail.com</a>.</>]
] as const;
export default function TermsPage(){return <div className="v2-policy-page v2-policy-terms"><section className="v2-policy-hero"><div className="v2-shell"><p className="v2-section-label">Last updated · 9 September 2026</p><h1>Use the platform<br/><em>with integrity.</em></h1><p>These terms set practical boundaries for using Amaana&apos;s public information, assistance-request and domestic-donation services.</p></div></section><section className="v2-policy-principles"><div className="v2-shell"><div><span>Honesty</span><strong>Information submitted should be accurate.</strong></div><div><span>Boundaries</span><strong>A request is not a promise of assistance.</strong></div><div><span>Security</span><strong>Unauthorized access or interference is prohibited.</strong></div></div></section><section className="v2-policy-body"><div className="v2-shell v2-policy-layout"><aside><p>Terms of use</p><strong>Clear expectations protect applicants, donors, the team and the integrity of the work.</strong><Link href="/privacy">Privacy policy →</Link><Link href="/how-we-verify">How we verify →</Link></aside><div className="v2-policy-sections">{sections.map(([n,title,body])=><article key={n}><span>{n}</span><div><h2>{title}</h2><p>{body}</p></div></article>)}</div></div></section></div>}
