import { MIN_REPORTABLE_CELL, type FunnelRow, type FunnelStage, type ReportableCount } from "@/lib/donation-funnel";

const METHOD_LABEL: Record<string, string> = {
  ALL: "All methods",
  RAZORPAY: "Online (Razorpay)",
  DIRECT_UPI: "Direct UPI transfer",
  BANK_TRANSFER: "Bank transfer",
};

const STAGES: readonly { stage: FunnelStage; label: string }[] = [
  { stage: "started", label: "Started" },
  { stage: "awaiting", label: "Awaiting payment or verification" },
  { stage: "confirmed", label: "Confirmed" },
  { stage: "unsuccessful", label: "Unsuccessful" },
];

function Cell({ value }: { value: ReportableCount }) {
  return value.suppressed
    ? <td title="Withheld so that a small count in this row cannot be picked out or worked out by subtraction">withheld<span className="sr-only"> to protect small counts</span></td>
    : <td>{value.count}</td>;
}

/** Server-confirmed donation outcomes as aggregate counts, by payment method. Counts from recorded payment status only,
 * with small cells hidden (see donation-funnel.ts). It never shows who gave, and it says nothing about where donors came
 * from: that would need a consented event store. */
export function AdminDonationFunnel({ rows, windowDays }: { rows: readonly FunnelRow[]; windowDays: number }) {
  return (
    <section className="card" aria-labelledby="donation-funnel-heading" style={{ marginBottom: "1.25rem" }}>
      <p className="eyebrow">Outcomes</p>
      <h2 id="donation-funnel-heading">Donation outcomes, last {windowDays} days</h2>
      <p className="muted">
        Counted from recorded payment status, not from browser activity. Counts under {MIN_REPORTABLE_CELL} are withheld so no individual can be picked out; a neighbouring count in the same row is withheld too when showing it would let a hidden one be worked out, so a cell marked withheld is not necessarily small, and a total is left out when it would reveal one.
        This does not show where donors came from.
      </p>
      {rows.length === 0 ? <p className="muted">No donations were started in this period.</p> : <div className="admin-table-wrap" tabIndex={0} role="region" aria-label={`Donation outcomes by payment method, last ${windowDays} days`}>
        <table>
          <caption className="sr-only">Donation outcomes by payment method, last {windowDays} days</caption>
          <thead><tr><th scope="col">Payment method</th>{STAGES.map(item => <th scope="col" key={item.stage}>{item.label}</th>)}<th scope="col">Confirmed share</th></tr></thead>
          <tbody>{rows.map(row => <tr key={row.method}>
            <th scope="row">{METHOD_LABEL[row.method] ?? row.method}</th>
            {STAGES.map(item => <Cell key={item.stage} value={row.cells[item.stage]} />)}
            <td>{row.confirmedShare === null ? "—" : `${row.confirmedShare}%`}</td>
          </tr>)}</tbody>
        </table>
      </div>}
    </section>
  );
}
