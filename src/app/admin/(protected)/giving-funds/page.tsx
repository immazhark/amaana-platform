import type { Prisma } from "@prisma/client";
import { getAdminPagination, parseAdminPage } from "@/lib/admin-pagination";
import Link from "@/components/navigation-link";
import { hasPermission, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { summarizeSettledDonationAggregate } from "@/lib/fund-ledger";
import { allocationPlanningEnabled } from "@/lib/allocation-proposal-operations";
import { summarizeFundPlanning } from "@/lib/fund-planning-summary";
import { FUND_INTENTS, FUND_STATUSES, fundNextStatuses } from "@/lib/giving-funds";
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

export default async function GivingFundsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string; refresh?: string; status?: string; q?: string; page?: string }> }) {
  const user = await requirePermission("fund.view");
  const canViewDonations = hasPermission(user, "donation.view");
  const params = await searchParams;
  const status = FUND_STATUSES.find(value => value === params.status);
  const query = typeof params.q === "string" && params.q.trim().length <= 80 ? params.q.trim() : "";
  const where: Prisma.GivingFundWhereInput = {
    ...(status ? { status } : {}),
    ...(query ? { OR: ["name", "slug", "accountCode"].map(field => ({ [field]: { contains: query, mode: "insensitive" } })) } : {}),
  };
  const total = await prisma.givingFund.count({ where });
  const pagination = getAdminPagination(total, parseAdminPage(params.page));
  const funds = await prisma.givingFund.findMany({
    where, orderBy: [{ status: "asc" }, { updatedAt: "desc" }, { id: "desc" }],
    take: pagination.pageSize, skip: pagination.skip,
    select: {
      id: true, slug: true, name: true, purpose: true, disclosure: true, accountCode: true,
      acceptedIntents: true, status: true, currency: true, revision: true,
      createdById: true, lastEditedById: true,
      createdBy: { select: { name: true } }, approvedBy: { select: { name: true } },
    },
  });
  const fundsWithReadPermission = funds.map(fund => fund.id);
  const showPlanning = canViewDonations && allocationPlanningEnabled();
  // Group directly in SQL: retrieving a bounded slice of allocation records
  // would silently understate a busy fund's approved planning total.
  const [financialRows, planRows, refundConflictRows] = await Promise.all([
    canViewDonations && fundsWithReadPermission.length
      ? prisma.donation.groupBy({
        by: ["fundId"],
        where: { fundId: { in: fundsWithReadPermission }, status: { in: ["CAPTURED", "REFUNDED"] } },
        _sum: { amount: true, refundedAmount: true }, _count: { _all: true },
      }) : Promise.resolve([]),
    showPlanning && fundsWithReadPermission.length ?
      prisma.donationAllocationProposal.groupBy({
        by: ["fundId"],
        where: {
          fundId: { in: fundsWithReadPermission },
          status: "APPROVED", reversal: { is: null },
        },
        _sum: { amountPaise: true }, _count: { _all: true },
      }) : Promise.resolve([]),
      showPlanning && fundsWithReadPermission.length ? prisma.donationAllocationProposal.groupBy({
        by: ["fundId"],
        where: {
          fundId: { in: fundsWithReadPermission },
          status: "APPROVED", reversal: { is: null },
          donation: { is: {
            OR: [{ status: { not: "CAPTURED" } }, { refundedAmount: { gt: 0 } }],
          } },
        },
        _count: { _all: true },
      }) : Promise.resolve([]),
  ]);
  const plans = new Map(planRows.map(row => [row.fundId, row]));
  const refundConflicts = new Map(refundConflictRows.map(row => [row.fundId, row._count._all]));
  const balances = new Map(financialRows.map(row => [row.fundId, row]));
  const displayINR = (rupees: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(rupees);
  const canManage = hasPermission(user, "fund.manage");
  const canApprove = hasPermission(user, "fund.approve");
  const pageHref = (page: number) => {
    const search = new URLSearchParams();
    if (status) search.set("status", status);
    if (query) search.set("q", query);
    search.set("page", String(page));
    return `/admin/giving-funds?${search}`;
  };
  return <>
    <header className="admin-heading"><div><p className="eyebrow">Donation governance</p><h1>Giving fund registry</h1><p className="muted">Record fund purposes and disclosures, then have a different approver review them. Registry approval does not open public checkout or move money.</p></div></header>
    <p className="muted">This registry supports domestic INR general giving and Sadaqah. Zakat remains restricted to the existing verified eligible appeal flow.</p>
    {params.error ? <p role="alert">{params.error.slice(0, 300)}</p> : params.saved === "1" ? <p role="status">Fund registry saved.{params.refresh === "delayed" ? " View refresh was delayed. Reload before making another change." : ""}</p> : null}
    {canManage && <section className="card"><h2>Create a draft fund</h2><form action={createGivingFund} className="form-grid"><DraftFields prefix="new-fund" /><div className="field full"><button className="button">Create draft</button></div></form></section>}
    <form action="/admin/giving-funds" method="get" className="filter-row" aria-label="Filter registered funds">
      <label htmlFor="fund-registry-status">Registry status</label>
      <select id="fund-registry-status" name="status" defaultValue={status ?? ""}>
        <option value="">All statuses</option>
        {FUND_STATUSES.map(value => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
      </select>
      <label htmlFor="fund-registry-search">Fund name, slug or accounting code</label>
      <input id="fund-registry-search" name="q" type="search" maxLength={80} defaultValue={query}/>
      <button className="button secondary" type="submit">Find funds</button>
      {(status || query) && <Link href="/admin/giving-funds">Clear filters</Link>}
    </form>
    <p role="status">{total} matching funds · showing {funds.length} on page {pagination.page} of {pagination.totalPages}.</p>
    <section className="grid" aria-label="Registered funds">
      {!funds.length && <p>No funds match this registry view.</p>}
      {funds.map(fund => {
        const nextStatuses = fundNextStatuses(fund.status).filter(next => next === "UNDER_REVIEW" ? canManage : canApprove).filter(next => next !== "APPROVED" || (user.id !== fund.createdById && user.id !== fund.lastEditedById));
        return <article className="card" key={fund.id}>
          <div className="admin-heading"><h2>{fund.name}</h2><span className="status-badge">{fund.status.replaceAll("_", " ")}</span></div>
          <p>{fund.purpose}</p><p>{fund.disclosure}</p>
          <Link href={`/admin/giving-funds/${fund.id}/preview`}>Review donor flow</Link>
          <p className="muted">{fund.accountCode} · {fund.currency} · {fund.acceptedIntents.join(" / ")} · Created by {fund.createdBy.name}{fund.approvedBy ? ` · Approved by ${fund.approvedBy.name}` : ""}</p>
          {canViewDonations && (() => {
            const balance = balances.get(fund.id);
            let totals: ReturnType<typeof summarizeSettledDonationAggregate>;
            try {
              totals = balance ? summarizeSettledDonationAggregate({
                amount: balance._sum.amount,
                refundedAmount: balance._sum.refundedAmount,
                settledDonations: balance._count._all,
              }) : { grossCapturedPaise: 0, refundedPaise: 0,
                netRetainedPaise: 0, settledDonations: 0 };
            } catch {
              return <p role="alert">Fund net receipts require financial reconciliation.</p>;
            }
            const approved = plans.get(fund.id);
            const planning = showPlanning ? summarizeFundPlanning({
              netRetainedPaise: totals.netRetainedPaise,
              approvedPaise: approved?._sum.amountPaise ?? null,
              activeApprovals: approved?._count._all ?? 0,
              refundConflictApprovals: refundConflicts.get(fund.id) ?? 0,
            }) : null;
            return <>
              {balance
                ? <p className="muted">Gross captured: {displayINR(totals.grossCapturedPaise / 100)} · Refunded: {displayINR(totals.refundedPaise / 100)} · Net retained: {displayINR(totals.netRetainedPaise / 100)} · {totals.settledDonations} settled records</p>
                : <p className="muted">No captured contributions recorded for this fund.</p>}
              {planning && <div>
                <p className="muted">Internal allocation planning · {planning.activeApprovals} reviewed active proposals</p>
                {planning.state === "CLEAR"
                  ? <p className="muted">
                      Internally approved plans: {displayINR(planning.approvedPaise / 100)} ·
                      Unplanned portion of retained receipts: {displayINR(planning.remainingUnplannedPaise / 100)}
                    </p>
                  : <p role="alert">Internal allocation planning requires finance reconciliation
                      ({planning.reason.replaceAll("_", " ").toLowerCase()}).
                      Do not infer an available balance.</p>}
                <p className="muted">These amounts describe internal proposed allocations only,
                  not bank cash, paid expenses or beneficiary outcomes.{" "}
                  <Link href="/admin/allocations">Review proposals and conflicts</Link>
                </p>
              </div>}
            </>;
          })()}
          {fund.status === "DRAFT" && canManage && <details><summary>Edit draft</summary><form action={updateGivingFund} className="form-grid"><input type="hidden" name="id" value={fund.id} /><input type="hidden" name="revision" value={fund.revision} /><DraftFields prefix={fund.id} values={fund} /><div className="field full"><button className="button secondary">Save draft</button></div></form></details>}
          {nextStatuses.length > 0 && <form action={transitionGivingFund} className="field"><input type="hidden" name="id" value={fund.id} /><input type="hidden" name="revision" value={fund.revision} /><label htmlFor={`${fund.id}-status`}>Move to</label><select id={`${fund.id}-status`} name="status">{nextStatuses.map(status => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select><label htmlFor={`${fund.id}-reason`}>Review or status-change reason</label><textarea id={`${fund.id}-reason`} name="reason" minLength={12} maxLength={500} required /><button className="button secondary">Apply status</button></form>}
          {fund.status === "UNDER_REVIEW" && canApprove && (user.id === fund.createdById || user.id === fund.lastEditedById) && <p>A different approver must review this fund.</p>}
        </article>;
      })}
    </section>
    <nav className="filter-row" aria-label="Fund registry pages">
      {pagination.hasPrevious && <Link href={pageHref(pagination.page - 1)}>Previous funds</Link>}
      <span>Page {pagination.page} of {pagination.totalPages} · {total} matching funds</span>
      {pagination.hasNext && <Link href={pageHref(pagination.page + 1)}>Next funds</Link>}
    </nav>
  </>;
}
