import { requirePermission } from "@/lib/auth";
import { formatINR } from "@/lib/appeals";
import { GIVING_STREAMS, streamLabel } from "@/lib/giving-streams";
import { getFundsLedger } from "@/lib/funds-ledger";

export const dynamic = "force-dynamic";

const rupees = (paise: number) => formatINR(paise / 100);

export default async function FundsLedgerPage() {
  await requirePermission("donation.view");
  const { byStream, zakat } = await getFundsLedger();
  return <>
    <div className="admin-heading">
      <div>
        <p className="eyebrow">Funds ledger</p>
        <h1>Where the money belongs</h1>
        <p className="muted">All giving reaches one bank account; this ledger separates it by stream. Received means verified and net of refunds. Transfers awaiting bank verification are shown separately and are never counted as received.</p>
      </div>
    </div>
    <section className="admin-card" aria-labelledby="zakat-account-heading">
      <p className="eyebrow">Zakat account</p>
      <h2 id="zakat-account-heading">Total Zakat received</h2>
      <div className="card-grid">
        <article className="card"><strong>{rupees(zakat.receivedPaise)}</strong><p>Verified Zakat received (net of refunds)</p></article>
        <article className="card"><strong>{rupees(zakat.pendingVerificationPaise)}</strong><p>Zakat awaiting verification</p></article>
        <article className="card"><strong>{rupees(zakat.refundedPaise)}</strong><p>Zakat refunded</p></article>
      </div>
    </section>
    <section className="admin-card" aria-labelledby="stream-ledger-heading">
      <h2 id="stream-ledger-heading">By giving stream</h2>
      <table className="admin-table">
        <thead><tr><th scope="col">Stream</th><th scope="col">Received</th><th scope="col">Awaiting verification</th><th scope="col">Refunded</th></tr></thead>
        <tbody>
          {GIVING_STREAMS.map(stream => {
            const bucket = byStream[stream];
            return <tr key={stream}>
              <th scope="row">{streamLabel(stream)}</th>
              <td>{rupees(bucket?.receivedPaise ?? 0)}</td>
              <td>{rupees(bucket?.pendingVerificationPaise ?? 0)}</td>
              <td>{rupees(bucket?.refundedPaise ?? 0)}</td>
            </tr>;
          })}
        </tbody>
      </table>
    </section>
  </>;
}
