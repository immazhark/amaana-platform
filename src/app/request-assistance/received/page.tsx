import Link from "next/link";

type Props = { searchParams: Promise<{ reference?: string; token?: string }> };

export default async function ReceivedPage({ searchParams }: Props) {
  const { reference, token } = await searchParams;
  return <div className="v2-home v2-state-page"><section className="v2-state-hero"><div className="v2-shell v2-state-grid"><div><p className="v2-section-label">Request received</p><h1>Your request is now in<br />a private review journey.</h1><p>Thank you for reaching out. Amaana will review what you shared and contact you if supporting details are needed.</p>{reference && <div className="v2-reference-block"><span>Private reference</span><strong>{reference}</strong><small>Keep this reference and tracking link private.</small></div>}<div className="v2-hero-actions">{reference && token && <Link className="v2-button" href={`/request-assistance/status?reference=${encodeURIComponent(reference)}&token=${encodeURIComponent(token)}`}>Track this request</Link>}<Link className="v2-text-link" href="/">Return home →</Link></div></div><aside className="v2-state-steps"><span>What happens next</span><ol><li><b>01</b><div><strong>Review begins</strong><p>The team examines the information submitted.</p></div></li><li><b>02</b><div><strong>Follow-up if needed</strong><p>You may be contacted for clarification or supporting documents.</p></div></li><li><b>03</b><div><strong>Decision</strong><p>The request progresses according to Amaana&apos;s verification process.</p></div></li></ol></aside></div></section></div>;
}
