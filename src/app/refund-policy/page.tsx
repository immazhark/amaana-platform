import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "Refund Policy",
  description: "How to report an erroneous or duplicate donation to Amaana Foundation.",
  alternates: { canonical: "/refund-policy" },
  openGraph: { type: "website", url: "/refund-policy", title: "Refund Policy | Amaana Foundation", description: "How to report an erroneous or duplicate donation to Amaana Foundation." },
  twitter: { card: "summary", title: "Refund Policy | Amaana Foundation", description: "How to report an erroneous or duplicate donation to Amaana Foundation." },
};
const sections=[
["01","Requesting review",<>If you believe a donation was duplicated, entered incorrectly or processed without authorization, contact <a href="mailto:amaanafoundation24@gmail.com">amaanafoundation24@gmail.com</a> promptly with the Amaana donation reference and Razorpay payment ID.</>],
["02","Assessment",<>Each request is reviewed against platform and payment records. Amaana may request reasonable information needed to verify the payer and transaction. <strong>Never send a card number, UPI PIN, banking password or OTP.</strong></>],
["03","Outcome and timing",<>Approval is not automatic and may depend on whether funds have already been applied to the stated charitable purpose, applicable requirements and payment-provider rules. Approved refunds are returned through the original payment method and processing time is controlled by the payment provider and banking network.</>],
["04","Accounting",<>Processed refunds are recorded against the original donation and deducted from the appeal&apos;s confirmed collection total.</>]
] as const;
export default function RefundPolicyPage(){return <div className="v2-policy-page v2-policy-refund"><section className="v2-policy-hero"><div className="v2-shell"><p className="v2-section-label">Payment support</p><h1>Errors deserve<br/><em>a fair review.</em></h1><p>Charitable donations are generally treated as final, but genuine payment errors will be reviewed fairly and against the actual payment record.</p></div></section><section className="v2-policy-principles"><div className="v2-shell"><div><span>Report</span><strong>Share the Amaana reference and payment ID.</strong></div><div><span>Review</span><strong>The transaction is checked against records.</strong></div><div><span>Outcome</span><strong>Approved refunds return through the original method.</strong></div></div></section><section className="v2-policy-body"><div className="v2-shell v2-policy-layout"><aside><p>Refund policy</p><strong>A payment problem should be handled calmly, securely and from evidence — never by asking for banking secrets.</strong><a href="mailto:amaanafoundation24@gmail.com">Contact payment support →</a><Link href="/donation-policy">Donation policy →</Link></aside><div className="v2-policy-sections">{sections.map(([n,title,body])=><article key={n}><span>{n}</span><div><h2>{title}</h2><p>{body}</p></div></article>)}</div></div></section></div>}
