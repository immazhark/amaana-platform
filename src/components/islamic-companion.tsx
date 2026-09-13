"use client";

import { useEffect, useRef, useState } from "react";
import { AYAHS, HADITHS, HYDERABAD_ZONE, PRAYERS, dailyReading, estimatedHijri, hyderabadClock, nextSalah, remindersFor, shiftDate, timeMinutes, type PrayerDay } from "@/lib/daily-companion";

type Moon = { day: number; month: number; label: string; authority: string; sourceUrl: string };
type PrayerData = { today: PrayerDay; tomorrow: PrayerDay | null; school: string; method: string; asr: string; moon: Moon | null; eveningMoon: Moon | null; note: string };
type Panel = "readings" | "prayers" | null;

function CompanionIcon({ kind }: { kind: "book" | "moon" | "close" }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === "book" ? <><path d="M12 5c-3-2-7-2-10-1v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Z" /><path d="M12 5v15" /></> : kind === "moon" ? <path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z" /> : <path d="m6 6 12 12M6 18 18 6" />}
  </svg>;
}

export function IslamicCompanion() {
  const [panel, setPanel] = useState<Panel>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [data, setData] = useState<PrayerData | null>(null);
  const [school, setSchool] = useState("1");
  const [requestVersion, setRequestVersion] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [paused, setPaused] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reminderIndex, setReminderIndex] = useState(0);
  const [showSchedule, setShowSchedule] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const readingsButton = useRef<HTMLButtonElement>(null);
  const prayersButton = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 30_000);
    const visible = () => { if (!document.hidden) update(); };
    document.addEventListener("visibilitychange", visible);
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReducedMotion(preference.matches);
    motion();
    preference.addEventListener("change", motion);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", visible); preference.removeEventListener("change", motion); };
  }, []);

  const date = now ? hyderabadClock(now).date : "";
  useEffect(() => {
    if (panel !== "prayers" || !date) return;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/public/islamic-companion?school=${school}`, { cache: "no-store", signal: controller.signal });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Prayer times could not be loaded.");
        if (payload.today?.date !== date || payload.school !== school || !PRAYERS.every(prayer => timeMinutes(payload.today?.timings?.[prayer]) !== null)) throw new Error("The timings are not current. Please try again.");
        if (!controller.signal.aborted) setData(payload as PrayerData);
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Prayer times could not be loaded.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [date, panel, school, requestVersion]);

  useEffect(() => {
    if (!panel) return;
    panelRef.current?.focus({ preventScroll: true });
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPanel(null);
        (panel === "readings" ? readingsButton : prayersButton).current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [panel]);

  const currentData = data?.today.date === date && data.school === school ? data : null;
  const clock = now ? hyderabadClock(now) : null;
  const maghrib = timeMinutes(currentData?.today.timings.Maghrib);
  const afterSunset = clock !== null && maghrib !== null && clock.minutes >= maghrib;
  const moon = currentData ? (afterSunset ? currentData.eveningMoon : currentData.moon) : null;
  const reading = now ? dailyReading(now) : null;
  const reminders = now ? remindersFor(now, currentData?.moon) : [];
  const activeReminder = reminders.length ? reminders[reminderIndex % reminders.length] : null;
  const upcoming = now && currentData ? nextSalah(currentData.today, currentData.tomorrow, now) : null;

  useEffect(() => {
    if (paused || reducedMotion || hovered || focused || showSchedule || panel || reminders.length < 2) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setReminderIndex(index => index + 1);
    }, 14_000);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion, hovered, focused, showSchedule, panel, reminders.length]);

  function closePanel() {
    setPanel(null);
    (panel === "readings" ? readingsButton : prayersButton).current?.focus({ preventScroll: true });
  }

  async function copyReading() {
    if (!reading) return;
    const { ayah, hadith } = reading;
    const text = `Amaana Foundation · ${reading.date}\nQur’an ${ayah.key}${ayah.excerpt ? " (excerpt)" : ""}\n${ayah.arabic}\n${ayah.meaning}\nThe Clear Quran · Dr. Mustafa Khattab\nhttps://quran.com/${ayah.key.replace(":", "/")}\n\nHadith meaning summary: ${hadith.summary}\n${hadith.reference}\n${hadith.url}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage("Reading and references copied.");
    } catch { setCopyMessage("Copy is unavailable. You can select the text or open its source link."); }
  }

  return <>
    <section className="amaana-reminders" aria-label="Daily Islamic reminders" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <div className="amaana-reminder-inner">
        <div className="amaana-reminder-content" aria-live="off">
          <strong>{activeReminder?.title ?? "A moment for remembrance"}</strong>
          <p>{activeReminder?.text ?? "Daily readings and gentle reminders, on Hyderabad time."}</p>
          {activeReminder && <div className="amaana-reminder-links"><a href={activeReminder.source} target="_blank" rel="noopener noreferrer">{activeReminder.reference}</a>{activeReminder.readUrl && <a href={activeReminder.readUrl} target="_blank" rel="noopener noreferrer">Read the surah</a>}</div>}
        </div>
        <div className="amaana-reminder-controls">
          <button type="button" onClick={() => setPaused(value => !value)} aria-pressed={!paused} disabled={reducedMotion}>{reducedMotion ? "Motion off" : paused ? "Auto-play" : "Pause"}</button>
          <button type="button" onClick={() => { setPaused(true); setReminderIndex(index => index + 1); }} aria-label="Next reminder">Next</button>
          <button type="button" onClick={() => setShowSchedule(value => !value)} aria-expanded={showSchedule} aria-controls="companion-schedule">Schedule</button>
        </div>
      </div>
      {showSchedule && <div className="amaana-reminder-schedule" id="companion-schedule">
        <h2>Reminders for your week</h2>
        <dl><div><dt>Monday & Thursday</dt><dd>Voluntary fasting, when permissible · before 18:00</dd></div><div><dt>Friday</dt><dd>Al-Kahf and durood</dd></div><div><dt>Every night · 20:00–04:00</dt><dd>Al-Baqarah 2:285–286 and Al-Mulk</dd></div><div><dt>Morning · 04:00–10:00 / Evening · 16:00–20:00</dt><dd>Adhkar and Sayyid al-Istighfar</dd></div><div><dt>Throughout the day</dt><dd>Istighfar, tasbih, takbeer, tahleel and tahmeed</dd></div></dl>
        <p>All windows use Hyderabad time (IST). These are on-site reading prompts, not prayer rulings or device notifications.</p>
        <button type="button" onClick={() => { setShowSchedule(false); readingsButton.current?.focus(); }}>Close schedule</button>
      </div>}
    </section>

    <aside className="amaana-companion" aria-label="Amaana daily companions">
      <div className="amaana-companion-dock">
        <button ref={readingsButton} type="button" aria-expanded={panel === "readings"} aria-controls="amaana-reading-panel" onClick={() => setPanel(value => value === "readings" ? null : "readings")}><CompanionIcon kind="book" /><span>Ayah & Hadith</span></button>
        <button ref={prayersButton} type="button" aria-expanded={panel === "prayers"} aria-controls="amaana-prayer-panel" onClick={() => setPanel(value => value === "prayers" ? null : "prayers")}><CompanionIcon kind="moon" /><span>Salah & Hijri</span></button>
      </div>
      {panel && <div className="amaana-companion-panel" id={panel === "readings" ? "amaana-reading-panel" : "amaana-prayer-panel"} ref={panelRef} tabIndex={-1} role="region" aria-labelledby="companion-panel-title">
        <header className="amaana-companion-head"><h2 id="companion-panel-title">{panel === "readings" ? "Today’s ayah & hadith" : "Salah & Hijri date"}</h2><button type="button" onClick={closePanel} aria-label="Close companion"><CompanionIcon kind="close" /></button></header>
        {panel === "readings" ? <>
          <p className="amaana-companion-note">{date || "Today"} · Changes at midnight in Hyderabad</p>
          {reading ? <>
            <section className="amaana-daily-ayah" aria-labelledby="daily-ayah-title"><h3 id="daily-ayah-title">{reading.ayah.surah} · {reading.ayah.key}{reading.ayah.excerpt ? " · excerpt" : ""}</h3><p className="amaana-arabic" lang="ar" dir="rtl">{reading.ayah.arabic}</p><blockquote>{reading.ayah.meaning}</blockquote><p className="amaana-companion-note">Dr. Mustafa Khattab · The Clear Quran{reading.ayah.excerpt ? " · excerpt" : ""}</p><a href={`https://quran.com/${reading.ayah.key.replace(":", "/")}`} target="_blank" rel="noopener noreferrer">Read, listen & explore tafsir on Quran.com</a></section>
            <section className="amaana-daily-hadith" aria-labelledby="daily-hadith-title"><h3 id="daily-hadith-title">Hadith of the day</h3><h4>{reading.hadith.title}</h4><p>{reading.hadith.summary}</p><p className="amaana-companion-note">Meaning summary, not a verbatim quotation · {reading.hadith.grade}</p><a href={reading.hadith.url} target="_blank" rel="noopener noreferrer">{reading.hadith.reference} · Read the full narration</a></section>
            <button className="amaana-companion-action" type="button" onClick={copyReading}>Copy reading & references</button><p role="status" className="amaana-companion-note">{copyMessage}</p>
            <details className="amaana-companion-details"><summary>About these readings</summary><p>A reviewed collection of {AYAHS.length} Qur’an selections and {HADITHS.length} hadith summaries, rotating daily. Qur’an excerpts are marked. Source links include the surrounding text; translations and grading are attributed.</p></details>
          </> : <p>Preparing today’s reading…</p>}
        </> : <>
          <p className="amaana-companion-location">Hyderabad, India <span>IST · UTC+05:30</span></p>
          <div className="amaana-hijri"><h3>Hijri date</h3><strong>{moon?.label ?? (date ? estimatedHijri(afterSunset ? shiftDate(date, 1) : date) : "Loading date…")}</strong><p>{moon ? <>Based on {moon.authority}. <a href={moon.sourceUrl} target="_blank" rel="noopener noreferrer">Moon-sighting announcement</a></> : "Calculated estimate · Hyderabad moon-sighting not yet confirmed."}</p><small>{maghrib !== null ? "The Hijri day advances at Hyderabad Maghrib." : "Civil-day estimate; sunset rollover is unavailable until prayer times load."}</small></div>
          <label className="amaana-asr-choice">Asr calculation<select value={school} onChange={event => setSchool(event.target.value)}><option value="1">Hanafi</option><option value="0">Shafi / Maliki / Hanbali</option></select></label>
          {loading && <p role="status">Loading Hyderabad timings…</p>}
          {error && <div className="amaana-companion-error" role="alert"><p>{error}</p><button type="button" onClick={() => setRequestVersion(value => value + 1)}>Try again</button></div>}
          {currentData && !loading && !error && <>
            {upcoming ? <div className="amaana-next-salah"><span>{upcoming.tomorrow ? "Tomorrow’s first Salah" : "Next Salah"}</span><strong>{upcoming.prayer} <time>{upcoming.time}</time></strong></div> : <p>Today’s prayers have passed. Tomorrow’s Fajr is not available yet.</p>}
            <dl className="amaana-salah-times">{PRAYERS.map(prayer => <div key={prayer} className={upcoming?.prayer === prayer && !upcoming.tomorrow ? "is-next" : undefined}><dt>{prayer}{prayer === "Sunrise" ? " (not a Salah)" : ""}</dt><dd><time>{currentData.today.timings[prayer]}</time></dd></div>)}</dl>
            <p className="amaana-companion-note">{currentData.today.date} · 24-hour time · {HYDERABAD_ZONE}</p><p className="amaana-companion-note">{currentData.note}</p><details className="amaana-companion-details"><summary>Calculation & date sources</summary><p>Prayer times: <a href="https://aladhan.com/calculation-methods" target="_blank" rel="noopener noreferrer">AlAdhan</a> · {currentData.method} · {currentData.asr} Asr. This widget uses Hyderabad’s city coordinates; it does not request your location.</p><p>The fallback calendar is tabular Islamic Civil, not an Indian moon-sighting announcement. A dated local announcement is required before a month is labelled locally confirmed.</p></details>
          </>}
        </>}
      </div>}
    </aside>
  </>;
}
