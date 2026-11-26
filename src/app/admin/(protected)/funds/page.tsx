import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { formatINR } from "@/lib/appeals";
import { getFundsLedger } from "@/lib/funds-ledger";
import { loadTaleemSponsorshipReport } from "@/lib/taleem-sponsorship-report";
import { formatDonationReportINR } from "@/lib/donation-reconciliation-totals";
import { TALEEM_CATALOGUE } from "@/content/taleem-catalogue";
import { prisma } from "@/lib/prisma";
import { APPEAL_BUCKET, type PoolTotals } from "@/lib/giving-funds";

export const dynamic = "force-dynamic";

const rupees = (paise: number) => formatINR(paise / 100);
const ZAKAT_LABEL = { ACCEPTED: "Zakat accepted", NOT_ACCEPTED: "Zakat not accepted", UNDER_REVIEW: "Zakat under review" } as const;
const EMPTY: PoolTotals = { receivedPaise: 0, pendingPaise: 0, refundedPaise: 0, spentPaise: 0, publishedSpentPaise: 0, balancePaise: 0 };

export default async function FundsLedgerPage() {
  await requirePermission("donation.view");
  const [{ funds, byFund, zakatAccount }, sponsorships] = await Promise.all([getFundsLedger(), loadTaleemSponsorshipReport(prisma)]);
  const appealTotals = byFund[APPEAL_BUCKET]?.total ?? EMPTY;
  return <>
    <div className="admin-heading">
      <div>
        <p className="eyebrow">Funds ledger</p>
        <h1>Where the money belongs</h1>
        <p><Link href="/admin/funds/spending">Record and publish where money was spent</Link>  · <Link href="/admin/funds/manage">Manage funds</Link> · <Link href="/admin/funds/campaigns">Seasonal campaigns</Link></p>
        <p className="muted">All giving reaches one bank account; this ledger separates it by fund. Received means verified and net of refunds. Transfers awaiting bank verification are shown separately and are never counted as received. Balance is received minus recorded spending.</p>
      </div>
    </div>
    <section className="admin-card" aria-labelledby="zakat-account-heading">
      <p className="eyebrow">Zakat account</p>
      <h2 id="zakat-account-heading">All Zakat received, across every fund and appeal</h2>
      <div className="card-grid">
        <article className="card"><strong>{rupees(zakatAccount.receivedPaise)}</strong><p>Verified Zakat received (net of refunds)</p></article>
        <article className="card"><strong>{rupees(zakatAccount.pendingPaise)}</strong><p>Zakat awaiting verification</p></article>
        <article className="card"><strong>{rupees(zakatAccount.spentPaise)}</strong><p>Zakat disbursed from funds</p></article>
        <article className="card"><strong>{rupees(zakatAccount.balancePaise)}</strong><p>Zakat balance still to distribute</p></article>
      </div>
    </section>
    <section className="admin-card" aria-labelledby="fund-ledger-heading">
      <h2 id="fund-ledger-heading">By fund</h2>
      <table className="admin-table">
        <thead><tr><th scope="col">Fund</th><th scope="col">Received</th><th scope="col">Awaiting verification</th><th scope="col">Spent</th><th scope="col">Balance</th><th scope="col">Of which Zakat</th></tr></thead>
        <tbody>
          {funds.map(fund => {
            const totals = byFund[fund.id];
            return <tr key={fund.id}>
              <th scope="row">{fund.name}<br /><small>{ZAKAT_LABEL[fund.zakatPolicy]} · {fund.status}</small></th>
              <td>{rupees(totals?.total.receivedPaise ?? 0)}</td>
              <td>{rupees(totals?.total.pendingPaise ?? 0)}</td>
              <td>{rupees(totals?.total.spentPaise ?? 0)}</td>
              <td>{rupees(totals?.total.balancePaise ?? 0)}</td>
              <td>{rupees(totals?.zakat.balancePaise ?? 0)}</td>
            </tr>;
          })}
          <tr>
            <th scope="row">Appeals (case-specific)<br /><small>Tracked per appeal</small></th>
            <td>{rupees(appealTotals.receivedPaise)}</td>
            <td>{rupees(appealTotals.pendingPaise)}</td>
            <td>—</td>
            <td>—</td>
            <td>—</td>
          </tr>
        </tbody>
      </table>
    </section>
    <section className="admin-card" aria-labelledby="taleem-report-heading">
      <h2 id="taleem-report-heading">Taleem sponsorship reconciliation</h2>
      <p className="muted">Programme-level gifts grouped by their original monthly rate and rate version, across all recorded dates. Verified records include subsequently refunded gifts. Pending claims are not receipts. These amounts are not student assignments, fee obligations or recurring payment mandates.</p>
      {sponsorships.length === 0 ? <p>No verified sponsorship gifts or pending claims recorded.</p> : <div className="admin-table-wrap" role="region" aria-label="Taleem sponsorship totals" tabIndex={0}>
        <table className="admin-table">
          <thead><tr><th scope="col">Programme and recorded rate</th><th scope="col">Verified records</th><th scope="col">Gross verified</th><th scope="col">Principal refunded</th><th scope="col">Net retained</th><th scope="col">Pending claims</th><th scope="col">Pending amount</th></tr></thead>
          <tbody>{sponsorships.map(row => <tr key={JSON.stringify([row.programme, row.monthlyRate, row.rateVersion])}>
            <th scope="row">{TALEEM_CATALOGUE.programmes.find(programme => programme.id === row.programme)?.name ?? row.programme}<br /><small>{formatDonationReportINR(row.monthlyRate)} per unit/month · {row.rateVersion}</small></th>
            <td>{row.verifiedCount}</td><td>{formatDonationReportINR(row.grossCaptured)}</td><td>{formatDonationReportINR(row.principalRefunded)}</td><td>{formatDonationReportINR(row.netRetained)}</td><td>{row.pendingCount}</td><td>{formatDonationReportINR(row.pendingAmount)}</td>
          </tr>)}</tbody>
        </table>
      </div>}
    </section>
  </>;
}
