import { MONTHLY_GIVING_DAYS } from "@/lib/monthly-giving-reminder";
import styles from "./monthly-giving-reminder.module.css";

export function MonthlyGivingReminder({ invalid = false }: { invalid?: boolean }) {
  return <div className={styles.panel}>
    <div className={styles.intro}>
      <h3>Set a private giving reminder</h3>
      <p>Choose a schedule for reviewing approved giving routes. <strong>This is not a subscription, standing instruction or automatic payment.</strong></p>
      <p>Monthly and Friday schedules start from today’s date in India (IST). All reminders are all-day calendar events.</p>
      {invalid ? <p role="alert">The reminder could not be prepared. Choose a valid schedule below. Daily reminders must cover one to ten consecutive days.</p> : null}
    </div>
    <div className={styles.action}>
      <form method="get" action="/api/giving-reminder">
        <input type="hidden" name="frequency" value="monthly" />
        <label className={styles.field}>Day of each month
          <select name="day" defaultValue="15">{MONTHLY_GIVING_DAYS.map(day => <option value={day} key={day}>Day {day}</option>)}</select>
          <span>Days 1–28 recur every month, including February.</span>
        </label>
        <button className="v2-button" type="submit">Download monthly reminder</button>
      </form>
      <form method="get" action="/api/giving-reminder">
        <input type="hidden" name="frequency" value="friday" />
        <button className="v2-button" type="submit">Download every Friday reminder</button>
      </form>
      <details><summary>Choose one date or a short daily schedule</summary>
        <p>For Ramadan, Dhul-Hijjah or Eid, confirm dates with your local masjid before choosing civil dates here. Amaana does not calculate or confirm those dates in this planner.</p>
        <form method="get" action="/api/giving-reminder">
          <input type="hidden" name="frequency" value="date" />
          <label className={styles.field}>One reminder date<input name="start" type="date" min="2000-01-01" max="9998-12-31" required /></label>
          <button className="v2-button" type="submit">Download one-date reminder</button>
        </form>
        <form method="get" action="/api/giving-reminder">
          <input type="hidden" name="frequency" value="daily" />
          <label className={styles.field}>First day<input name="start" type="date" min="2000-01-01" max="9998-12-31" required /></label>
          <label className={styles.field}>Last day (up to ten days, inclusive)<input name="end" type="date" min="2000-01-01" max="9998-12-31" required /></label>
          <button className="v2-button" type="submit">Download daily reminders</button>
        </form>
      </details>
      <p>Import the file into your calendar. You can edit or delete its events; your calendar provider may synchronize them to your account. Reimporting the same schedule may update an existing event or create a duplicate, depending on your calendar.</p>
    </div>
    <p className={styles.disclosure}>The download requests only your chosen schedule. Amaana does not collect donor information or initiate payment here. Review current domestic giving options before each contribution.</p>
  </div>;
}
