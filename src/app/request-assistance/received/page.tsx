import Link from "next/link";

type Props = { searchParams: Promise<{ reference?: string; token?: string }> };

export default async function ReceivedPage({ searchParams }: Props) {
  const { reference, token } = await searchParams;
  return <section className="section"><div className="container"><div className="card form-card"><p className="eyebrow">Request received</p><h1>Thank you for reaching out.</h1><p className="lead">Keep this private tracking link. Amaana Foundation will review the information and contact you if supporting details are required.</p>{reference && <p className="reference">Reference: <strong>{reference}</strong></p>}<div className="actions">{reference && token && <Link className="button" href={`/request-assistance/status?reference=${encodeURIComponent(reference)}&token=${encodeURIComponent(token)}`}>Track request</Link>}<Link className="button secondary" href="/">Return home</Link></div></div></div></section>;
}
