import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "Donation Policy",
  description: "How domestic donations are accepted, recorded and acknowledged by Amaana Foundation.",
  alternates: { canonical: "/donation-policy" },
  openGraph: { type: "website", url: "/donation-policy", title: "Donation Policy | Amaana Foundation", description: "How domestic donations are accepted, recorded and acknowledged by Amaana Foundation." },
  twitter: { card: "summary", title: "Donation Policy | Amaana Foundation", description: "How domestic donations are accepted, recorded and acknowledged by Amaana Foundation." },
};
const sections=[
["01","Who may donate",<>The checkout requires confirmation that funds are being contributed from an Indian source through a domestic payment method. <strong>Foreign contributions are not accepted.</strong></>],
["02","Payment confirmation",<>Razorpay processes checkout. A donation is recorded as successful only after cryptographic verification and confirmation of the captured payment. Failed, abandoned or unverified orders are not added to an appeal&apos;s collected total.</>],
["03","Use and reconciliation",<>Donations are recorded against the appeal selected at checkout. Displayed collection totals reflect confirmed captured payments, adjusted for processed refunds. Administrative reconciliation may cause short delays before updates appear.</>],
["04","Privacy preference",<>Donors may request public anonymity. Amaana will still retain the identity and transaction information needed for payment, accounting, security and compliance records.</>],
["05","Acknowledgement",<>After confirmation, the platform provides a normal donation acknowledgement. <strong>It is not an 80G tax-deduction certificate.</strong></>]
] as const;
export default function DonationPolicyPage(){return <div className="v2-policy-page v2-policy-giving"><section className="v2-policy-hero"><div className="v2-shell"><p className="v2-section-label">Responsible giving</p><h1>Give with<br/><em>clarity.</em></h1><p>Amaana currently accepts domestic INR donations for approved, published appeals. The rules below explain what the platform records and what a donor should expect.</p></div></section><section className="v2-policy-principles"><div className="v2-shell"><div><span>Source</span><strong>Domestic Indian contributions only.</strong></div><div><span>Confirmation</span><strong>Only verified captured payments count.</strong></div><div><span>Acknowledgement</span><strong>Clear record, without overstating tax status.</strong></div></div></section><section className="v2-policy-body"><div className="v2-shell v2-policy-layout"><aside><p>Donation policy</p><strong>Trust is not only about where support goes. It is also about being precise about how it is received.</strong><Link href="/appeals">See verified appeals →</Link><Link href="/refund-policy">Refund policy →</Link></aside><div className="v2-policy-sections">{sections.map(([n,title,body])=><article key={n}><span>{n}</span><div><h2>{title}</h2><p>{body}</p></div></article>)}</div></div></section></div>}
