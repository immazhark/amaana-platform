"use client";

import { useState } from "react";
import {
  buildMonthlyGivingReminder, buildFridayGivingReminder, MONTHLY_GIVING_DAYS,
  MONTHLY_REMINDER_FILE, FRIDAY_REMINDER_FILE, type MonthlyGivingDay,
} from "@/lib/monthly-giving-reminder";
import styles from "./monthly-giving-reminder.module.css";

export function MonthlyGivingReminder() {
  const [day, setDay] = useState<MonthlyGivingDay>(15);
  const [frequency, setFrequency] = useState<"monthly" | "friday">("monthly");
  const [failed, setFailed] = useState(false);
  function downloadCalendar() {
    try {
      const calendar = frequency === "monthly"
        ? buildMonthlyGivingReminder(day, new Date()) : buildFridayGivingReminder(new Date());
      const url = URL.createObjectURL(new Blob([calendar], { type: "text/calendar;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = frequency === "monthly" ? MONTHLY_REMINDER_FILE : FRIDAY_REMINDER_FILE;
      document.body.appendChild(link);
      try { link.click(); }
      finally {
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      setFailed(false);
    } catch { setFailed(true); }
  }

  return <div className={styles.panel}>
    <div className={styles.intro}>
      <h3>Set a private giving reminder</h3>
      <p>Your calendar can invite you to review the currently approved giving routes. <strong>This is not a subscription, standing instruction or automatic payment.</strong></p>
    </div>
    <label className={styles.field}>
      Reminder frequency
      <select value={frequency} onChange={event => {
        const next = event.target.value;
        if (next === "monthly" || next === "friday") {
          setFrequency(next);
          setFailed(false);
        }
      }}>
        <option value="monthly">Monthly — choose a day</option>
        <option value="friday">Every Friday — weekly</option>
      </select>
      <span>Each event is a personal reminder, not a promise of available fundraising.</span>
    </label>
    {frequency === "monthly" && <label className={styles.field}>
      Day of each month
      <select value={day} onChange={event => {
        const proposed = Number(event.target.value);
        if (MONTHLY_GIVING_DAYS.some(value => value === proposed)) {
          setDay(proposed as MonthlyGivingDay);
          setFailed(false);
        }
      }}>
        {MONTHLY_GIVING_DAYS.map(value => <option key={value} value={value}>Day {value}</option>)}
      </select>
      <span>Days 1–28 recur every month, including February.</span>
    </label>}
    <div className={styles.action}>
      <button type="button" className="v2-button" onClick={downloadCalendar}>Download calendar reminder</button>
      {failed && <p role="alert">The calendar file could not be prepared. You can still review giving options directly.</p>}
      <p>Import the downloaded file into your calendar application. You can change or delete the event. Your calendar provider may synchronize it to your own account.</p>
    </div>
    <p className={styles.disclosure}>Amaana does not collect donor information, create a mandate or initiate any payment here. A reminder never authorizes a contribution or proves a fund is currently eligible. Only domestic approved donation options are available.</p>
  </div>;
}
