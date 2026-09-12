"use client";

import { useEffect, useMemo, useState } from "react";

type CompanionData = {
  hijri: { date: string | null; day: string | null; month: string | null; year: string | null; weekday: string | null };
  gregorian: string | null;
  timezone: string | null;
  method: string;
  school: string;
  timings: Record<"Fajr" | "Sunrise" | "Dhuhr" | "Asr" | "Maghrib" | "Isha", string | null>;
  note: string;
};

const prayerOrder: Array<keyof CompanionData["timings"]> = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
const selectablePrayers = prayerOrder.filter(prayer => prayer !== "Sunrise");

function minutesFromTime(value: string | null) {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function nextPrayer(data: CompanionData | null, now: Date) {
  if (!data) return null;
  const current = now.getHours() * 60 + now.getMinutes();
  for (const prayer of selectablePrayers) {
    const minutes = minutesFromTime(data.timings[prayer]);
    if (minutes !== null && minutes > current) return { prayer, time: data.timings[prayer] };
  }
  return { prayer: "Fajr" as const, time: data.timings.Fajr, tomorrow: true };
}

export function IslamicCompanion() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "locating" | "loading" | "ready" | "error">("idle");
  const [data, setData] = useState<CompanionData | null>(null);
  const [message, setMessage] = useState("Use your location to see calculated Salah times and today’s Hijri date.");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const upcoming = useMemo(() => nextPrayer(data, now), [data, now]);

  const loadForLocation = () => {
    if (!navigator.geolocation) {
      setStatus("error");
      setMessage("Location is not available in this browser.");
      return;
    }

    setStatus("locating");
    setMessage("Finding your location…");
    navigator.geolocation.getCurrentPosition(async position => {
      try {
        setStatus("loading");
        setMessage("Calculating today’s timings…");
        const params = new URLSearchParams({
          lat: String(position.coords.latitude),
          lon: String(position.coords.longitude),
          method: "karachi",
        });
        const response = await fetch(`/api/public/islamic-companion?${params.toString()}`, { cache: "no-store" });
        const payload = await response.json() as CompanionData & { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Unable to load prayer times.");
        setData(payload);
        setStatus("ready");
        setMessage("");
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Unable to load prayer times.");
      }
    }, error => {
      setStatus("error");
      setMessage(error.code === error.PERMISSION_DENIED
        ? "Location permission was not granted. You can continue using the site normally."
        : "We couldn’t determine your location right now.");
    }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 900_000 });
  };

  return (
    <aside className={`islamic-companion${open ? " open" : ""}`} aria-label="Islamic companion">
      <button
        className="islamic-companion-tab"
        type="button"
        aria-expanded={open}
        aria-controls="islamic-companion-panel"
        onClick={() => setOpen(value => !value)}
      >
        <span className="islamic-companion-crescent" aria-hidden="true">☾</span>
        <span className="islamic-companion-tab-copy">
          <small>{data?.hijri.month && data.hijri.day ? `${data.hijri.day} ${data.hijri.month}` : "Islamic companion"}</small>
          <strong>{upcoming?.time ? `${upcoming.prayer} · ${upcoming.time}` : "Today"}</strong>
        </span>
      </button>

      <div className="islamic-companion-panel" id="islamic-companion-panel" hidden={!open}>
        <div className="islamic-companion-head">
          <div>
            <small>Amaana Companion</small>
            <h2>Today, with intention.</h2>
          </div>
          <button className="islamic-companion-close" type="button" aria-label="Close Islamic companion" onClick={() => setOpen(false)}>×</button>
        </div>

        {status !== "ready" || !data ? (
          <div className="islamic-companion-empty">
            <span className="islamic-companion-orbit" aria-hidden="true">☾</span>
            <p>{message}</p>
            <button className="v2-button" type="button" onClick={loadForLocation} disabled={status === "locating" || status === "loading"}>
              {status === "locating" ? "Finding location…" : status === "loading" ? "Loading timings…" : "Use my location"}
            </button>
            <small>Your location is used only to calculate this request; the widget does not ask Amaana to store it.</small>
          </div>
        ) : (
          <>
            <div className="islamic-companion-date">
              <span>{data.hijri.weekday ?? "Hijri date"}</span>
              <strong>{[data.hijri.day, data.hijri.month, data.hijri.year].filter(Boolean).join(" ")}</strong>
              <small>{data.gregorian}{data.timezone ? ` · ${data.timezone}` : ""}</small>
            </div>

            {upcoming && (
              <div className="islamic-companion-next">
                <span>{upcoming.tomorrow ? "Next after today" : "Next Salah"}</span>
                <strong>{upcoming.prayer}</strong>
                <b>{upcoming.time ?? "—"}</b>
              </div>
            )}

            <div className="islamic-companion-times" aria-label="Calculated prayer times">
              {prayerOrder.map(prayer => (
                <div key={prayer} className={upcoming?.prayer === prayer && !upcoming.tomorrow ? "next" : undefined}>
                  <span>{prayer}</span><strong>{data.timings[prayer] ?? "—"}</strong>
                </div>
              ))}
            </div>

            <div className="islamic-companion-reminder">
              <small>Gentle reminder</small>
              <p>Prayer times are a calculated guide. Follow your local masjid timetable where it differs.</p>
            </div>

            <div className="islamic-companion-method">
              <span>{data.method}</span>
              <span>{data.school}</span>
              <p>{data.note}</p>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
