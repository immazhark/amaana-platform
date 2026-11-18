import Link from "next/link";
import { hasPermission, requirePermission } from "@/lib/auth";
import { FUND_STATUSES } from "@/lib/fund-admin";
import { prisma } from "@/lib/prisma";
import { createFundAction, updateFundAction } from "./actions";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ notice?: string }> };

const ZAKAT_OPTIONS = [["ACCEPTED", "Zakat accepted"], ["NOT_ACCEPTED", "Non-Zakat only"], ["UNDER_REVIEW", "Under review (treated as non-Zakat)"]] as const;
const STATUS_LABEL: Record<string, string> = { DRAFT: "Draft (not visible)", ACTIVE: "Active (accepting gifts)", PAUSED: "Paused", CLOSED: "Closed" };

function ZakatSelect({ id, value }: { id: string; value: string }) {
  return <select id={id} name="zakatPolicy" defaultValue={value} required>{ZAKAT_OPTIONS.map(([option, label]) => <option key={option} value={option}>{label}</option>)}</select>;
}

export default async function ManageFundsPage({ searchParams }: Props) {
  const user = await requirePermission("donation.view");
  const canManage = hasPermission(user, "donation.reconcile");
  const { notice } = await searchParams;
  const funds = await prisma.fund.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, slug: true, name: true, summary: true, zakatPolicy: true, status: true, sortOrder: true, isGeneral: true },
  });
  return <>
    <div className="admin-heading">
      <div>
        <p className="eyebrow">Funds ledger</p>
        <h1>Manage funds</h1>
        <p className="muted">Funds are what donors choose on the giving page. A fund&apos;s slug never changes once created, so shared links keep working. Changing a Zakat position affects only future gifts and must record its basis; every change is audited. <Link href="/admin/funds">Back to balances</Link></p>
      </div>
    </div>
    {notice ? <p className="status-badge" role="status">{notice.slice(0, 200)}</p> : null}
    <section className="admin-card" aria-labelledby="funds-heading">
      <h2 id="funds-heading">Funds</h2>
      {funds.map(fund => <details key={fund.id} className="admin-card">
        <summary><strong>{fund.name}</strong> <small>{fund.slug}{fund.isGeneral ? " · General" : ""} · {STATUS_LABEL[fund.status]}</small></summary>
        {canManage ? <form action={updateFundAction} className="form-grid">
          <input type="hidden" name="id" value={fund.id} />
          <div className="field"><label htmlFor={`name-${fund.id}`}>Name (public)</label><input id={`name-${fund.id}`} name="name" defaultValue={fund.name} minLength={3} maxLength={80} required /></div>
          <div className="field"><label htmlFor={`order-${fund.id}`}>Display order</label><input id={`order-${fund.id}`} name="sortOrder" inputMode="numeric" pattern="[0-9]{1,4}" defaultValue={String(fund.sortOrder)} /></div>
          <div className="field full"><label htmlFor={`summary-${fund.id}`}>Summary (public, 10 to 200 characters)</label><textarea id={`summary-${fund.id}`} name="summary" defaultValue={fund.summary} minLength={10} maxLength={200} required /></div>
          <div className="field"><label htmlFor={`zakat-${fund.id}`}>Zakat position</label><ZakatSelect id={`zakat-${fund.id}`} value={fund.zakatPolicy} /></div>
          <div className="field"><label htmlFor={`status-${fund.id}`}>Status</label><select id={`status-${fund.id}`} name="status" defaultValue={fund.status} required>{FUND_STATUSES.map(status => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}</select></div>
          <div className="field full"><label htmlFor={`basis-${fund.id}`}>Basis for a Zakat change <span className="muted">only needed if you change the Zakat position</span></label><textarea id={`basis-${fund.id}`} name="zakatBasis" maxLength={500} /></div>
          <div className="field full"><button className="button" type="submit">Save changes</button></div>
        </form> : <p className="muted">{fund.summary}</p>}
      </details>)}
    </section>
    {canManage ? <section className="admin-card" aria-labelledby="create-fund-heading">
      <h2 id="create-fund-heading">Create a fund</h2>
      <form action={createFundAction} className="form-grid">
        <div className="field"><label htmlFor="new-slug">Slug (permanent)</label><input id="new-slug" name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" minLength={2} maxLength={40} required /></div>
        <div className="field"><label htmlFor="new-name">Name (public)</label><input id="new-name" name="name" minLength={3} maxLength={80} required /></div>
        <div className="field full"><label htmlFor="new-summary">Summary (public, 10 to 200 characters)</label><textarea id="new-summary" name="summary" minLength={10} maxLength={200} required /></div>
        <div className="field"><label htmlFor="new-zakat">Zakat position</label><select id="new-zakat" name="zakatPolicy" defaultValue="UNDER_REVIEW" required>{ZAKAT_OPTIONS.map(([option, label]) => <option key={option} value={option}>{label}</option>)}</select></div>
        <div className="field"><label htmlFor="new-status">Status</label><select id="new-status" name="status" defaultValue="DRAFT" required>{FUND_STATUSES.map(status => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}</select></div>
        <div className="field"><label htmlFor="new-order">Display order</label><input id="new-order" name="sortOrder" inputMode="numeric" pattern="[0-9]{1,4}" /></div>
        <div className="field full"><label htmlFor="new-basis">Basis for accepting Zakat <span className="muted">required if Zakat is accepted</span></label><textarea id="new-basis" name="zakatBasis" maxLength={500} /></div>
        <div className="field full"><button className="button" type="submit">Create fund</button></div>
      </form>
    </section> : <p className="muted">Your account can view funds but cannot change them.</p>}
  </>;
}
