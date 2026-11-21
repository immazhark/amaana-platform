import Link from "next/link";
import { hasPermission, requirePermission } from "@/lib/auth";
import { formatINR } from "@/lib/appeals";
import { prisma } from "@/lib/prisma";
import { publishDisbursementAction, recordDisbursementAction, voidDisbursementAction } from "../actions";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ notice?: string }> };

const POOL_LABEL = { ZAKAT: "Zakat", NON_ZAKAT: "Non-Zakat" } as const;

export default async function FundSpendingPage({ searchParams }: Props) {
  const user = await requirePermission("donation.view");
  const canRecord = hasPermission(user, "donation.reconcile");
  const { notice } = await searchParams;
  const [funds, entries] = await Promise.all([
    prisma.fund.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
    prisma.fundDisbursement.findMany({
      orderBy: [{ spentOn: "desc" }, { createdAt: "desc" }],
      take: 100,
      select: { id: true, pool: true, amount: true, spentOn: true, financialYear: true, title: true, publicSummary: true, status: true, voidReason: true, fund: { select: { name: true } } },
    }),
  ]);
  return <>
    <div className="admin-heading">
      <div>
        <p className="eyebrow">Funds ledger</p>
        <h1>Where the money went</h1>
        <p className="muted">Record what each fund paid for. Entries are never edited: a mistake is voided and re-entered. A draft counts against the fund&apos;s balance straight away; the public sees it only once it is published, and a second staff member must publish it: the person who recorded an entry cannot. <Link href="/admin/funds">Back to balances</Link></p>
      </div>
    </div>
    {notice ? <p className="status-badge" role="status">{notice.slice(0, 200)}</p> : null}
    {canRecord ? <section className="admin-card" aria-labelledby="record-heading">
      <h2 id="record-heading">Record spending</h2>
      <form action={recordDisbursementAction} className="form-grid">
        <div className="field"><label htmlFor="fundId">Fund</label><select id="fundId" name="fundId" required>{funds.map(fund => <option key={fund.id} value={fund.id}>{fund.name}</option>)}</select></div>
        <div className="field"><label htmlFor="pool">Paid from</label><select id="pool" name="pool" required><option value="NON_ZAKAT">Non-Zakat money</option><option value="ZAKAT">Zakat money</option></select></div>
        <div className="field"><label htmlFor="amount">Amount (₹)</label><input id="amount" name="amount" inputMode="decimal" pattern="[0-9]+(\.[0-9]{1,2})?" required /></div>
        <div className="field"><label htmlFor="spentOn">Date spent</label><input id="spentOn" name="spentOn" type="date" min="2020-01-01" required /></div>
        <div className="field full"><label htmlFor="title">Title (public)</label><input id="title" name="title" minLength={3} maxLength={120} required /></div>
        <div className="field full"><label htmlFor="publicSummary">Public summary (no names or contact details)</label><textarea id="publicSummary" name="publicSummary" maxLength={400} /></div>
        <fieldset className="field full"><legend>Only for Zakat money</legend>
          <label><input type="checkbox" name="zakatEligibilityConfirmed" value="yes" /> I have confirmed that every recipient is Zakat-eligible.</label>
          <label htmlFor="zakatEligibilityBasis">Basis for eligibility</label>
          <textarea id="zakatEligibilityBasis" name="zakatEligibilityBasis" maxLength={500} />
        </fieldset>
        <div className="field full"><button className="button" type="submit">Save as draft</button></div>
      </form>
    </section> : <p className="muted">Your account can view spending but cannot record it.</p>}
    <section className="admin-card" aria-labelledby="entries-heading">
      <h2 id="entries-heading">Recent entries</h2>
      <table className="admin-table">
        <thead><tr><th scope="col">Fund</th><th scope="col">Entry</th><th scope="col">Amount</th><th scope="col">Status</th>{canRecord ? <th scope="col">Actions</th> : null}</tr></thead>
        <tbody>
          {entries.map(entry => <tr key={entry.id}>
            <th scope="row">{entry.fund.name}<br /><small>{POOL_LABEL[entry.pool]} · FY {entry.financialYear}</small></th>
            <td>{entry.title}<br /><small>{entry.spentOn.toISOString().slice(0, 10)}</small></td>
            <td>{formatINR(entry.amount.toNumber())}</td>
            <td>{entry.status}{entry.status === "VOID" && entry.voidReason ? <><br /><small>{entry.voidReason}</small></> : null}</td>
            {canRecord ? <td>
              {entry.status === "DRAFT" ? <form action={publishDisbursementAction}><input type="hidden" name="id" value={entry.id} /><button className="button" type="submit">Publish</button></form> : null}
              {entry.status !== "VOID" ? <form action={voidDisbursementAction}><input type="hidden" name="id" value={entry.id} /><label htmlFor={`reason-${entry.id}`} className="muted">Reason to void</label><input id={`reason-${entry.id}`} name="reason" minLength={5} maxLength={500} required /><button className="text-button" type="submit">Void</button></form> : null}
            </td> : null}
          </tr>)}
          {entries.length === 0 ? <tr><td colSpan={canRecord ? 5 : 4}>No spending recorded yet.</td></tr> : null}
        </tbody>
      </table>
    </section>
  </>;
}
