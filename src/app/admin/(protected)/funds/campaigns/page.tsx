import Link from "next/link";
import { SEASONAL_GUIDANCE_2027, SEASONAL_GUIDANCE_NOTE } from "@/content/giving-calendar";
import { hasPermission, requirePermission } from "@/lib/auth";
import { formatINR } from "@/lib/appeals";
import { CAMPAIGN_STATUSES, campaignIsOpen, dateToIstLocal } from "@/lib/fund-campaign";
import { prisma } from "@/lib/prisma";
import { createCampaignAction, updateCampaignAction } from "./actions";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ notice?: string }> };

const STATUS_LABEL: Record<string, string> = { DRAFT: "Draft (not visible)", ACTIVE: "Active (open inside its window)", CLOSED: "Closed (final)" };
const dateTime = (value: Date) => value.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

export default async function CampaignsPage({ searchParams }: Props) {
  const user = await requirePermission("donation.view");
  const canManage = hasPermission(user, "donation.reconcile");
  const { notice } = await searchParams;
  const now = new Date();
  const [funds, campaigns] = await Promise.all([
    prisma.fund.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, slug: true } }),
    prisma.fundCampaign.findMany({
      orderBy: [{ opensAt: "desc" }],
      take: 100,
      select: { id: true, slug: true, title: true, unitLabel: true, unitLabelPlural: true, unitPrice: true, maxUnits: true, opensAt: true, closesAt: true, status: true, note: true, fund: { select: { name: true } }, _count: { select: { donations: true } } },
    }),
  ]);
  return <>
    <div className="admin-heading">
      <div>
        <p className="eyebrow">Funds ledger</p>
        <h1>Seasonal campaigns</h1>
        <p className="muted">A campaign lets donors give a fixed price per unit (kits, shares, kilograms) to a fund while its window is open. Set the price when the season&apos;s cost is known. The server checks the window, the unit limit and the exact total on every gift. Once a gift exists the price is frozen; close the campaign and open a new one to change it. <Link href="/admin/funds">Back to balances</Link></p>
      </div>
    </div>
    {notice ? <p className="status-badge" role="status">{notice.slice(0, 200)}</p> : null}
    <section className="admin-card" aria-labelledby="guidance-heading">
      <h2 id="guidance-heading">2027 timing guidance</h2>
      <ul className="history">{SEASONAL_GUIDANCE_2027.map(item => <li key={item.key}><strong>{item.label}</strong><span>{item.expected}</span><small>{item.basis}</small></li>)}</ul>
      <p className="muted">{SEASONAL_GUIDANCE_NOTE}</p>
    </section>
    <section className="admin-card" aria-labelledby="campaigns-heading">
      <h2 id="campaigns-heading">Campaigns</h2>
      {campaigns.length === 0 ? <p className="muted">No campaigns yet.</p> : null}
      {campaigns.map(campaign => <details key={campaign.id} className="admin-card">
        <summary><strong>{campaign.title}</strong> <small>{campaign.fund.name} · {formatINR(campaign.unitPrice.toNumber())} per {campaign.unitLabel} · {STATUS_LABEL[campaign.status]}{campaignIsOpen(campaign, now) ? " · open now" : ""} · {campaign._count.donations} gifts</small></summary>
        <p className="muted">{dateTime(campaign.opensAt)} to {dateTime(campaign.closesAt)} (India time) · slug {campaign.slug}</p>
        {canManage && campaign.status !== "CLOSED" ? <form action={updateCampaignAction} className="form-grid">
          <input type="hidden" name="id" value={campaign.id} />
          <div className="field full"><label htmlFor={`title-${campaign.id}`}>Title (public)</label><input id={`title-${campaign.id}`} name="title" defaultValue={campaign.title} minLength={3} maxLength={80} required /></div>
          <div className="field"><label htmlFor={`unit-${campaign.id}`}>Unit (singular)</label><input id={`unit-${campaign.id}`} name="unitLabel" defaultValue={campaign.unitLabel} pattern="[A-Za-z][A-Za-z ]{1,19}" required /></div>
          <div className="field"><label htmlFor={`plural-${campaign.id}`}>Unit (plural)</label><input id={`plural-${campaign.id}`} name="unitLabelPlural" defaultValue={campaign.unitLabelPlural} pattern="[A-Za-z][A-Za-z ]{1,19}" required /></div>
          <div className="field"><label htmlFor={`price-${campaign.id}`}>Price per unit (₹){campaign._count.donations > 0 ? " — frozen" : ""}</label><input id={`price-${campaign.id}`} name="unitPrice" inputMode="numeric" pattern="[1-9][0-9]{0,6}" defaultValue={String(campaign.unitPrice.toNumber())} readOnly={campaign._count.donations > 0} required /></div>
          <div className="field"><label htmlFor={`max-${campaign.id}`}>Most units in one gift</label><input id={`max-${campaign.id}`} name="maxUnits" inputMode="numeric" pattern="[0-9]{1,4}" defaultValue={String(campaign.maxUnits)} required /></div>
          <div className="field"><label htmlFor={`opens-${campaign.id}`}>Opens (India time)</label><input id={`opens-${campaign.id}`} name="opensAt" type="datetime-local" defaultValue={dateToIstLocal(campaign.opensAt)} required /></div>
          <div className="field"><label htmlFor={`closes-${campaign.id}`}>Closes (India time)</label><input id={`closes-${campaign.id}`} name="closesAt" type="datetime-local" defaultValue={dateToIstLocal(campaign.closesAt)} required /></div>
          <div className="field"><label htmlFor={`status-${campaign.id}`}>Status</label><select id={`status-${campaign.id}`} name="status" defaultValue={campaign.status} required>{CAMPAIGN_STATUSES.filter(status => campaign.status === "DRAFT" || status !== "DRAFT").map(status => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}</select></div>
          <div className="field full"><label htmlFor={`note-${campaign.id}`}>Public note <span className="muted">optional, 200 characters</span></label><textarea id={`note-${campaign.id}`} name="note" defaultValue={campaign.note ?? ""} maxLength={200} /></div>
          <div className="field full"><button className="button" type="submit">Save changes</button></div>
        </form> : null}
      </details>)}
    </section>
    {canManage ? <section className="admin-card" aria-labelledby="create-campaign-heading">
      <h2 id="create-campaign-heading">Create a campaign</h2>
      <form action={createCampaignAction} className="form-grid">
        <div className="field"><label htmlFor="c-fund">Fund</label><select id="c-fund" name="fundId" required>{funds.map(fund => <option key={fund.id} value={fund.id}>{fund.name}</option>)}</select></div>
        <div className="field"><label htmlFor="c-slug">Slug (permanent)</label><input id="c-slug" name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" minLength={2} maxLength={40} required /></div>
        <div className="field full"><label htmlFor="c-title">Title (public)</label><input id="c-title" name="title" minLength={3} maxLength={80} required /></div>
        <div className="field"><label htmlFor="c-unit">Unit (singular)</label><input id="c-unit" name="unitLabel" pattern="[A-Za-z][A-Za-z ]{1,19}" required /></div>
        <div className="field"><label htmlFor="c-plural">Unit (plural)</label><input id="c-plural" name="unitLabelPlural" pattern="[A-Za-z][A-Za-z ]{1,19}" required /></div>
        <div className="field"><label htmlFor="c-price">Price per unit (₹)</label><input id="c-price" name="unitPrice" inputMode="numeric" pattern="[1-9][0-9]{0,6}" required /></div>
        <div className="field"><label htmlFor="c-max">Most units in one gift</label><input id="c-max" name="maxUnits" inputMode="numeric" pattern="[0-9]{1,4}" defaultValue="100" required /></div>
        <div className="field"><label htmlFor="c-opens">Opens (India time)</label><input id="c-opens" name="opensAt" type="datetime-local" required /></div>
        <div className="field"><label htmlFor="c-closes">Closes (India time)</label><input id="c-closes" name="closesAt" type="datetime-local" required /></div>
        <div className="field"><label htmlFor="c-status">Status</label><select id="c-status" name="status" defaultValue="DRAFT" required>{CAMPAIGN_STATUSES.map(status => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}</select></div>
        <div className="field full"><label htmlFor="c-note">Public note <span className="muted">optional, 200 characters</span></label><textarea id="c-note" name="note" maxLength={200} /></div>
        <div className="field full"><button className="button" type="submit">Create campaign</button></div>
      </form>
    </section> : <p className="muted">Your account can view campaigns but cannot change them.</p>}
  </>;
}
