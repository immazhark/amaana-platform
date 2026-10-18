import {
  buildDatedGivingReminder, buildFridayGivingReminder, buildLastDayMonthlyGivingReminder, buildMonthlyGivingReminder,
  givingCalendarDateInIndia, MONTHLY_GIVING_DAYS, type MonthlyGivingDay,
  MONTHLY_REMINDER_FILE, FRIDAY_REMINDER_FILE,
} from "@/lib/monthly-giving-reminder";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow", "X-Content-Type-Options": "nosniff" };

/** Pure bounded download: no database, account, email or payment operation. */
export function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const frequency = params.get("frequency");
    const allowed = frequency === "monthly" ? ["frequency", "day"]
      : frequency === "friday" ? ["frequency"]
        : frequency === "date" ? ["frequency", "start"]
          : frequency === "daily" ? ["frequency", "start", "end"] : [];
    if (params.size !== allowed.length || allowed.some(key => params.getAll(key).length !== 1)
      || [...params.keys()].some(key => !allowed.includes(key))) throw new RangeError("Invalid schedule");
    const now = new Date();
    let body: string;
    let filename: string;
    if (frequency === "monthly") {
      const raw = params.get("day");
      if (raw === "last") {
        body = buildLastDayMonthlyGivingReminder(givingCalendarDateInIndia(now), now);
      } else {
        const day = MONTHLY_GIVING_DAYS.find(value => String(value) === raw) as MonthlyGivingDay | undefined;
        if (day === undefined) throw new RangeError("Invalid day");
        body = buildMonthlyGivingReminder(day, givingCalendarDateInIndia(now), now);
      }
      filename = MONTHLY_REMINDER_FILE;
    } else if (frequency === "friday") {
      body = buildFridayGivingReminder(givingCalendarDateInIndia(now), now);
      filename = FRIDAY_REMINDER_FILE;
    } else {
      body = buildDatedGivingReminder(params.get("start") ?? "", frequency === "daily" ? params.get("end") ?? "" : undefined, now);
      filename = "amaana-dated-giving-reminder.ics";
    }
    return new Response(body, { headers: { ...headers, "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"` } });
  } catch {
    return new Response(null, { status: 303, headers: { ...headers, Location: "/get-involved/monthly-giving?reminder=invalid#giving-reminder" } });
  }
}
