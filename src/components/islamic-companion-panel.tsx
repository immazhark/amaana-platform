"use client";

import { useEffect, useRef, useState } from "react";
import {
  AYAHS,
  HADITHS,
  HYDERABAD_ZONE,
  PRAYERS,
  dailyReading,
  estimatedHijri,
  hyderabadClock,
  nextSalah,
  shiftDate,
  timeMinutes,
  type PrayerDay,
} from "@/lib/daily-companion";

type Moon = {
  day: number;
  month: number;
  label: string;
  authority: string;
  sourceUrl: string;
};

type PrayerData = {
  today: PrayerDay;
  tomorrow: PrayerDay | null;
  school: string;
  method: string;
  asr: string;
  moon: Moon | null;
  eveningMoon: Moon | null;
  note: string;
};

export type CompanionPanelKind = "readings" | "prayers";

type MoonState = {
  date: string;
  moon: Moon | null;
};

type IslamicCompanionPanelProps = {
  panel: CompanionPanelKind;
  date: string;
  now: Date | null;
  onClose: () => void;
  onMoonChange: (value: MoonState) => void;
};

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 6 12 12M6 18 18 6" />
    </svg>
  );
}

function isPrayerData(value: unknown, date: string, school: string): value is PrayerData {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PrayerData>;
  if (candidate.school !== school || candidate.today?.date !== date) return false;
  return PRAYERS.every(prayer => timeMinutes(candidate.today?.timings?.[prayer]) !== null);
}

export function IslamicCompanionPanel({
  panel,
  date,
  now,
  onClose,
  onMoonChange,
}: IslamicCompanionPanelProps) {
  const [data, setData] = useState<PrayerData | null>(null);
  const [school, setSchool] = useState("1");
  const [requestVersion, setRequestVersion] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, panel]);

  useEffect(() => {
    if (panel !== "prayers" || !date) return;

    const controller = new AbortController();

    async function loadPrayerData() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/public/islamic-companion?school=${school}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload: unknown = await response.json();
        if (!response.ok) {
          const message = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "Prayer times could not be loaded.";
          throw new Error(message);
        }
        if (!isPrayerData(payload, date, school)) {
          throw new Error("The timings are not current. Please try again.");
        }
        if (!controller.signal.aborted) {
          setData(payload);
          onMoonChange({ date: payload.today.date, moon: payload.moon });
        }
      } catch (failure) {
        if (!controller.signal.aborted) {
          setError(failure instanceof Error ? failure.message : "Prayer times could not be loaded.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadPrayerData();
    return () => controller.abort();
  }, [date, onMoonChange, panel, requestVersion, school]);

  const currentData = data?.today.date === date && data.school === school ? data : null;
  const clock = now ? hyderabadClock(now) : null;
  const maghrib = timeMinutes(currentData?.today.timings.Maghrib);
  const afterSunset = clock !== null && maghrib !== null && clock.minutes >= maghrib;
  const moon = currentData ? (afterSunset ? currentData.eveningMoon : currentData.moon) : null;
  const reading = now ? dailyReading(now) : null;
  const upcoming = now && currentData ? nextSalah(currentData.today, currentData.tomorrow, now) : null;

  async function copyReading() {
    if (!reading) return;
    const { ayah, hadith } = reading;
    const text = `Amaana Foundation · ${reading.date}\nQur’an ${ayah.key}${ayah.excerpt ? " (excerpt)" : ""}\n${ayah.arabic}\n${ayah.meaning}\nThe Clear Quran · Dr. Mustafa Khattab\nhttps://quran.com/${ayah.key.replace(":", "/")}\n\nHadith meaning summary: ${hadith.summary}\n${hadith.reference}\n${hadith.url}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage("Reading and references copied.");
    } catch {
      setCopyMessage("Copy is unavailable. You can select the text or open its source link.");
    }
  }

  return (
    <div
      className="amaana-companion-panel"
      id={panel === "readings" ? "amaana-reading-panel" : "amaana-prayer-panel"}
      ref={panelRef}
      tabIndex={-1}
      role="region"
      aria-labelledby="companion-panel-title"
    >
      <header className="amaana-companion-head">
        <h2 id="companion-panel-title">{panel === "readings" ? "Today’s ayah & hadith" : "Salah & Hijri date"}</h2>
        <button type="button" onClick={onClose} aria-label="Close companion"><CloseIcon /></button>
      </header>

      {panel === "readings" ? (
        <>
          <p className="amaana-companion-note">{date || "Today"} · Changes at midnight in Hyderabad</p>
          {reading ? (
            <>
              <section className="amaana-daily-ayah" aria-labelledby="daily-ayah-title">
                <h3 id="daily-ayah-title">{reading.ayah.surah} · {reading.ayah.key}{reading.ayah.excerpt ? " · excerpt" : ""}</h3>
                <p className="amaana-arabic" lang="ar" dir="rtl">{reading.ayah.arabic}</p>
                <blockquote>{reading.ayah.meaning}</blockquote>
                <p className="amaana-companion-note">Dr. Mustafa Khattab · The Clear Quran{reading.ayah.excerpt ? " · excerpt" : ""}</p>
                <a href={`https://quran.com/${reading.ayah.key.replace(":", "/")}`} target="_blank" rel="noopener noreferrer">Read, listen & explore tafsir on Quran.com</a>
              </section>
              <section className="amaana-daily-hadith" aria-labelledby="daily-hadith-title">
                <h3 id="daily-hadith-title">Hadith of the day</h3>
                <h4>{reading.hadith.title}</h4>
                <p>{reading.hadith.summary}</p>
                <p className="amaana-companion-note">Meaning summary, not a verbatim quotation · {reading.hadith.grade}</p>
                <a href={reading.hadith.url} target="_blank" rel="noopener noreferrer">{reading.hadith.reference} · Read the full narration</a>
              </section>
              <button className="amaana-companion-action" type="button" onClick={copyReading}>Copy reading & references</button>
              <p role="status" className="amaana-companion-note">{copyMessage}</p>
              <details className="amaana-companion-details">
                <summary>About these readings</summary>
                <p>A reviewed collection of {AYAHS.length} Qur’an selections and {HADITHS.length} hadith summaries, rotating daily. Qur’an excerpts are marked. Source links include the surrounding text; translations and grading are attributed.</p>
              </details>
            </>
          ) : <p>Preparing today’s reading…</p>}
        </>
      ) : (
        <>
          <p className="amaana-companion-location">Hyderabad, India <span>IST · UTC+05:30</span></p>
          <div className="amaana-hijri">
            <h3>Hijri date</h3>
            <strong>{moon?.label ?? (date ? estimatedHijri(afterSunset ? shiftDate(date, 1) : date) : "Loading date…")}</strong>
            <p>{moon ? <>Based on {moon.authority}. <a href={moon.sourceUrl} target="_blank" rel="noopener noreferrer">Moon-sighting announcement</a></> : "Calculated estimate · Hyderabad moon-sighting not yet confirmed."}</p>
            <small>{maghrib !== null ? "The Hijri day advances at Hyderabad Maghrib." : "Civil-day estimate; sunset rollover is unavailable until prayer times load."}</small>
          </div>
          <label className="amaana-asr-choice">
            Asr calculation
            <select value={school} onChange={event => setSchool(event.target.value)}>
              <option value="1">Hanafi</option>
              <option value="0">Shafi / Maliki / Hanbali</option>
            </select>
          </label>
          {loading && <p role="status">Loading Hyderabad timings…</p>}
          {error && (
            <div className="amaana-companion-error" role="alert">
              <p>{error}</p>
              <button type="button" onClick={() => setRequestVersion(value => value + 1)}>Try again</button>
            </div>
          )}
          {currentData && !loading && !error && (
            <>
              {upcoming
                ? <div className="amaana-next-salah"><span>{upcoming.tomorrow ? "Tomorrow’s first Salah" : "Next Salah"}</span><strong>{upcoming.prayer} <time>{upcoming.time}</time></strong></div>
                : <p>Today’s prayers have passed. Tomorrow’s Fajr is not available yet.</p>}
              <dl className="amaana-salah-times">
                {PRAYERS.map(prayer => (
                  <div key={prayer} className={upcoming?.prayer === prayer && !upcoming.tomorrow ? "is-next" : undefined}>
                    <dt>{prayer}{prayer === "Sunrise" ? " (not a Salah)" : ""}</dt>
                    <dd><time>{currentData.today.timings[prayer]}</time></dd>
                  </div>
                ))}
              </dl>
              <p className="amaana-companion-note">{currentData.today.date} · 24-hour time · {HYDERABAD_ZONE}</p>
              <p className="amaana-companion-note">{currentData.note}</p>
              <details className="amaana-companion-details">
                <summary>Calculation & date sources</summary>
                <p>Prayer times: <a href="https://aladhan.com/calculation-methods" target="_blank" rel="noopener noreferrer">AlAdhan</a> · {currentData.method} · {currentData.asr} Asr. This widget uses Hyderabad’s city coordinates; it does not request your location.</p>
                <p>The fallback calendar is tabular Islamic Civil, not an Indian moon-sighting announcement. A dated local announcement is required before a month is labelled locally confirmed.</p>
              </details>
            </>
          )}
        </>
      )}
    </div>
  );
}
