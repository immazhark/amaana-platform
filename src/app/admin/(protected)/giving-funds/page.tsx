import { hasPermission, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FUND_INTENTS, fundNextStatuses } from "@/lib/giving-funds";
import { createGivingFund, transitionGivingFund, updateGivingFund } from "./actions";

type DraftValues = { slug: string; name: string; purpose: string; disclosure: string; accountCode: string; acceptedIntents: string[] };
function DraftFields({ prefix, values }: { prefix: string; values?: DraftValues }) {
  return <>
    <div className="field"><label htmlFor={`${prefix}-name`}>Fund name</label><input id={`${prefix}-name`} name="name" defaultValue={values?.name} minLength={5} maxLength={120} required /></div>
    <div className="field"><label htmlFor={`${prefix}-slug`}>URL slug</label><input id={`${prefix}-slug`} name="slug" defaultValue={values?.slug} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" minLength={3} maxLength={100} required /></div>
    <div className="field full"><label htmlFor={`${prefix}-purpose`}>Fund purpose and restrictions</label><textarea id={`${prefix}-purpose`} name="purpose" defaultValue={values?.purpose} minLength={20} maxLength={1000} required /></div>
    <div className="field full"><label htmlFor={`${prefix}-disclosure`}>Donor disclosure for review</label><textarea id={`${prefix}-disclosure`} name="disclosure" defaultValue={values?.disclosure} minLength={20} maxLength={2000} required /></div>
    <div className="field"><label htmlFor={`${prefix}-account`}>Internal accounting code</label><input id={`${prefix}-account`} name="accountCode" defaultValue={values?.accountCode} minLength={2} maxLength={32} pattern="[A-Z0-9]+(?:[-_][A-Z0-9]+)*" required /></div>
    <fieldset className="field"><legend>Accepted giving intentions</legend>{FUND_INTENTS.map(intent => <label className="checkbox" key={intent}><input type="checkbox" name="acceptedIntents" value={intent} defaultChecked={values?.acceptedIntents.includes(intent)} /><span>{intent === "GENERAL" ? "General giving" : "Sadaqah"}</span></label>)}</fieldset>
  </>;
}

export default async function GivingFundsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const user = await requirePermission("fund.view");
  const canViewDonations = hasPermission(user, "donation.view");
  const [funds, params, financialRows] = await Promise.all([
    prisma.givingFund.findMany({ orderBy: [{ status: "asc" }, { updatedAt: "desc" }], take: 100, include: { createdBy: { select: { name: true } }, approvedBy: { select: { name: true } } } }),
    searchParams,
    canViewDonations
      ? prisma.donation.groupBy({
          by: ["fundId"],
          where: { fundId: { not: null }, status: { in: ["CAPTURED", "REFUNDED"] } },
          _sum: { amount: true, refundedAmount: true },
          _count: { _all: true },
        })
      : Promise.resolve([]),
  ]);
  const balances = new Map(financialRows.map(row => [row.fundId, row]));
  const displayINR = (rupees: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(rupees);
  const canManage = hasPermission(user, "fund.manage");
  const canApprove = hasPermission(user, "fund.approve");
  return <>
    <header className="admin-heading"><div><p className="eyebrow">Donation governance</p><h1>Giving fund registry</h1><p className="muted">Record fund purposes and disclosures, then have a different approver review them. Registry approval does not open public checkout or move money.</p></div></header>
    <p className="muted">This registry supports domestic INR general giving and Sadaqah. Zakat remains restricted to the existing verified eligible appeal flow.</p>
    {params.error ? <p role="alert">{params.error.slice(0, 300)}</p> : params.saved === "1" ? <p role="status">Fund registry saved.</p> : null}
    {canManage && <section className="card"><h2>Create a draft fund</h2><form action={createGivingFund} className="form-grid"><DraftFields prefix="new-fund" /><div className="field full"><button className="button">Create draft</button></div></form></section>}
    <section className="grid" aria-label="Registered funds">
      {!funds.length && <p>No funds have been registered.</p>}
      {funds.map(fund => {
        const nextStatuses = fundNextStatuses(fund.status).filter(next => next === "UNDER_REVIEW" ? canManage : canApprove).filter(next => next !== "APPROVED" || (user.id !== fund.createdById && user.id !== fund.lastEditedById));
        return <article className="card" key={fund.id}>
          <div className="admin-heading"><h2>{fund.name}</h2><span className="status-badge">{fund.status.replaceAll("_", " ")}</span></div>
          <p>{fund.purpose}</p><p>{fund.disclosure}</p>
          <p className="muted">{fund.accountCode} · {fund.currency} · {fund.acceptedIntents.join(" / ")} · Created by {fund.createdBy.name}{fund.approvedBy ? ` · Approved by ${fund.approvedBy.name}` : ""}</p>
          {canViewDonations && (() => {
            const balance = balances.get(fund.id);
            if (!balance) return <p className="muted">No captured contributions recorded for this fund.</p>;
            const gross = balance._sum.amount?.toNumber() ?? 0;
            const refunded = balance._sum.refundedAmount?.toNumber() ?? 0;
            if (![gross, refunded].every(Number.isFinite) || gross < 0 || refunded < 0 || refunded > gross) {
              return <p role="alert">Fund net receipts require financial reconciliation.</p>;
            }
            return <p className="muted">Gross captured: {displayINR(gross)} · Refunded: {displayINR(refunded)} · Net retained: {displayINR(gross - refunded)} · {balance._count._all} settled records</p>;
          })()}
          {fund.status === "DRAFT" && canManage && <details><summary>Edit draft</summary><form action={updateGivingFund} className="form-grid"><input type="hidden" name="id" value={fund.id} /><input type="hidden" name="revision" value={fund.revision} /><DraftFields prefix={fund.id} values={fund} /><div className="field full"><button className="button secondary">Save draft</button></div></form></details>}
          {nextStatuses.length > 0 && <form action={transitionGivingFund} className="field"><input type="hidden" name="id" value={fund.id} /><input type="hidden" name="revision" value={fund.revision} /><label htmlFor={`${fund.id}-status`}>Move to</label><select id={`${fund.id}-status`} name="status">{nextStatuses.map(status => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select><label htmlFor={`${fund.id}-reason`}>Review or status-change reason</label><textarea id={`${fund.id}-reason`} name="reason" minLength={12} maxLength={500} required /><button className="button secondary">Apply status</button></form>}
          {fund.status === "UNDER_REVIEW" && canApprove && (user.id === fund.createdById || user.id === fund.lastEditedById) && <p>A different approver must review this fund.</p>}
        </article>;
      })}
      {funds.length === 100 && <p className="muted">Showing the 100 most recently updated funds within each status.</p>}
    </section>
  </>;
}
