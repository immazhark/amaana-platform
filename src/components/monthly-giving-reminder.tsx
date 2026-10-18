import { MONTHLY_GIVING_DAYS } from "@/lib/monthly-giving-reminder";

export function MonthlyGivingReminder({ invalid = false }: { invalid?: boolean }) {
  return <div className="form-grid" style={{ padding: "clamp(1.25rem, 3vw, 2.5rem)", border: "1px solid var(--af-color-border)", borderRadius: "1.25rem", background: "var(--af-color-surface)", lineHeight: 1.65 }}>
    <div style={{ minWidth: 0 }}>
      <h3>Set a private giving reminder</h3>
      <p>Choose a schedule for reviewing approved giving routes. <strong>This is not a subscription, standing instruction or automatic payment.</strong></p>
      <p>Monthly and Friday schedules start from today’s date in India (IST). All reminders are all-day calendar events.</p>
      {invalid ? <p role="alert">The reminder could not be prepared. Choose a valid schedule below. Daily reminders must cover one to ten consecutive days.</p> : null}
    </div>
    <div className="grid" style={{ minWidth: 0, gridTemplateColumns: "minmax(0, 1fr)" }}>
      <form className="grid" style={{ width: "100%", minWidth: 0, gridTemplateColumns: "minmax(0, 1fr)" }} method="get" action="/api/giving-reminder">
        <input type="hidden" name="frequency" value="monthly" />
        <label className="field" style={{ minWidth: 0, gridTemplateColumns: "minmax(0, 1fr)" }}>Day of each month
          <select style={{ width: "100%", maxWidth: "100%", minWidth: 0, minHeight: "3rem" }} name="day" defaultValue="15">{MONTHLY_GIVING_DAYS.map(day => <option value={day} key={day}>Day {day}</option>)}<option value="last">Last day of the month</option></select>
          <span>Days 1–28 recur on the same day each month. Last day follows the actual month-end, including February.</span>
        </label>
        <button className="v2-button" style={{ width: "100%", minWidth: 0, maxWidth: "100%", whiteSpace: "normal", overflowWrap: "anywhere" }} type="submit">Download monthly reminder</button>
      </form>
      <form className="grid" style={{ width: "100%", minWidth: 0, gridTemplateColumns: "minmax(0, 1fr)" }} method="get" action="/api/giving-reminder">
        <input type="hidden" name="frequency" value="friday" />
        <button className="v2-button" style={{ width: "100%", minWidth: 0, maxWidth: "100%", whiteSpace: "normal", overflowWrap: "anywhere" }} type="submit">Download every Friday reminder</button>
      </form>
      <details style={{ minWidth: 0, width: "100%" }}><summary style={{ cursor: "pointer", fontWeight: 750, minHeight: "3rem" }}>Choose one date or a short daily schedule</summary>
        <p>For Ramadan, Dhul-Hijjah or Eid, confirm dates with your local masjid before choosing civil dates here. Amaana does not calculate or confirm those dates in this planner.</p>
        <form className="grid" style={{ width: "100%", minWidth: 0, gridTemplateColumns: "minmax(0, 1fr)" }} method="get" action="/api/giving-reminder">
          <input type="hidden" name="frequency" value="date" />
          <label className="field" style={{ minWidth: 0, gridTemplateColumns: "minmax(0, 1fr)" }}>One reminder date<input style={{ width: "100%", maxWidth: "100%", minWidth: 0, minHeight: "3rem" }} name="start" type="date" min="2000-01-01" max="9998-12-31" required /></label>
          <button className="v2-button" style={{ width: "100%", minWidth: 0, maxWidth: "100%", whiteSpace: "normal", overflowWrap: "anywhere" }} type="submit">Download one-date reminder</button>
        </form>
        <form className="grid" style={{ width: "100%", minWidth: 0, gridTemplateColumns: "minmax(0, 1fr)" }} method="get" action="/api/giving-reminder">
          <input type="hidden" name="frequency" value="daily" />
          <label className="field" style={{ minWidth: 0, gridTemplateColumns: "minmax(0, 1fr)" }}>First day<input style={{ width: "100%", maxWidth: "100%", minWidth: 0, minHeight: "3rem" }} name="start" type="date" min="2000-01-01" max="9998-12-31" required /></label>
          <label className="field" style={{ minWidth: 0, gridTemplateColumns: "minmax(0, 1fr)" }}>Last day (up to ten days, inclusive)<input style={{ width: "100%", maxWidth: "100%", minWidth: 0, minHeight: "3rem" }} name="end" type="date" min="2000-01-01" max="9998-12-31" required /></label>
          <button className="v2-button" style={{ width: "100%", minWidth: 0, maxWidth: "100%", whiteSpace: "normal", overflowWrap: "anywhere" }} type="submit">Download daily reminders</button>
        </form>
      </details>
      <p>Import the file into your calendar. You can edit or delete its events; your calendar provider may synchronize them to your account. Reimporting the same schedule may update an existing event or create a duplicate, depending on your calendar.</p>
    </div>
    <p className="field full" style={{ minWidth: 0, margin: 0, padding: "1rem", background: "var(--af-color-surface-muted)" }}>The download requests only your chosen schedule. Amaana does not collect donor information or initiate payment here. Review current domestic giving options before each contribution.</p>
  </div>;
}
