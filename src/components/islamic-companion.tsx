"use client";

import Link from "next/link";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { hyderabadClock, remindersFor } from "@/lib/daily-companion";
import type { CompanionPanelKind } from "@/components/islamic-companion-panel";

type Moon = {
  day: number;
  month: number;
  label: string;
  authority: string;
  sourceUrl: string;
};

type MoonState = {
  date: string;
  moon: Moon | null;
};

type LiveRailItem = {
  id: string;
  kind: "appeal" | "initiative";
  eyebrow: string;
  title: string;
  subtitle: string;
  href: string;
  cta: string;
};

const IslamicCompanionPanel = lazy(() =>
  import("@/components/islamic-companion-panel").then(module => ({
    default: module.IslamicCompanionPanel,
  })),
);

function CompanionIcon({ kind }: { kind: "book" | "moon" }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {kind === "book"
        ? <><path d="M12 5c-3-2-7-2-10-1v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Z" /><path d="M12 5v15" /></>
        : <path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z" />}
    </svg>
  );
}

export function IslamicCompanion() {
  const [panel, setPanel] = useState<CompanionPanelKind | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [confirmedMoon, setConfirmedMoon] = useState<MoonState | null>(null);
  const [paused, setPaused] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reminderIndex] = useState(0);
  const [showSchedule, setShowSchedule] = useState(false);
  const [liveItems, setLiveItems] = useState<LiveRailItem[]>([]);
  const [railIndex, setRailIndex] = useState(0);
  const companionButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 30_000);
    const visible = () => {
      if (!document.hidden) update();
    };
    document.addEventListener("visibilitychange", visible);

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReducedMotion(preference.matches);
    motion();
    preference.addEventListener("change", motion);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
      preference.removeEventListener("change", motion);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/public/live-rail", { cache: "no-store", signal: controller.signal })
      .then(response => response.ok ? response.json() : { items: [] })
      .then((payload: { items?: LiveRailItem[] }) => {
        if (!controller.signal.aborted && Array.isArray(payload.items)) setLiveItems(payload.items);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const date = now ? hyderabadClock(now).date : "";
  const currentMoon = confirmedMoon?.date === date ? confirmedMoon.moon : null;
  const reminders = now ? remindersFor(now, currentMoon) : [];
  const activeReminder = reminders.length ? reminders[reminderIndex % reminders.length] : null;
  const railItems = useMemo(() => {
    const reminder = activeReminder ? [{
      id: `reminder-${activeReminder.id}`, kind: "reminder" as const, reminder: activeReminder,
    }] : [];
    return [...reminder, ...liveItems.map(item => ({ id: item.id, kind: "live" as const, live: item }))];
  }, [activeReminder, liveItems]);
  const activeRailItem = railItems.length ? railItems[safeRailIndex] : null;

  useEffect(() => {
    if (paused || reducedMotion || hovered || focused || showSchedule || panel || railItems.length < 2) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setRailIndex(index => index + 1);
    }, 12_000);
    return () => window.clearInterval(timer);
  }, [focused, hovered, panel, paused, reducedMotion, railItems.length, showSchedule]);

  const safeRailIndex = railItems.length ? railIndex % railItems.length : 0;
  const closePanel = useCallback(() => {
    setPanel(null);
    requestAnimationFrame(() => companionButton.current?.focus({ preventScroll: true }));
  }, []);

  const onMoonChange = useCallback((value: MoonState) => {
    if (!value.date) return;
    setConfirmedMoon(value);
  }, []);

  return (
    <>
      <section
        className="amaana-reminders"
        aria-label="Daily Islamic reminders"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={event => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
        }}
      >
        <div className="amaana-reminder-inner">
          <div className="amaana-live-badge" aria-hidden="true"><span />AMAANA LIVE</div>
          <div className="amaana-reminder-stage" aria-live="polite" aria-atomic="true">
            {activeRailItem?.kind === "live" ? (
              <div className="amaana-reminder-content amaana-reminder-content--live" key={activeRailItem.id}>
                <span className="amaana-reminder-eyebrow">{activeRailItem.live.eyebrow}</span>
                <strong>{activeRailItem.live.title}</strong>
                <p>{activeRailItem.live.subtitle}</p>
                <Link className="amaana-live-cta" href={activeRailItem.live.href}>{activeRailItem.live.cta}<span aria-hidden="true"> →</span></Link>
              </div>
            ) : (
              <div className="amaana-reminder-content" key={activeRailItem?.id ?? "fallback"}>
                <span className="amaana-reminder-eyebrow">Today’s reminder</span>
                <strong>{activeReminder?.title ?? "A moment for remembrance"}</strong>
                <p>{activeReminder?.text ?? "Daily readings and gentle reminders, on Hyderabad time."}</p>
                {activeReminder && <a className="amaana-reminder-source" href={activeReminder.source} target="_blank" rel="noopener noreferrer">{activeReminder.reference}</a>}
              </div>
            )}
          </div>
          <div className="amaana-reminder-controls" aria-label="Amaana Live controls">
            <button type="button" onClick={() => setRailIndex(index => (index - 1 + Math.max(railItems.length, 1)) % Math.max(railItems.length, 1))} aria-label="Previous update">‹</button>
            <button type="button" onClick={() => setPaused(value => !value)} aria-pressed={paused} disabled={reducedMotion} aria-label={paused ? "Play updates" : "Pause updates"}>{reducedMotion ? "•" : paused ? "▶" : "Ⅱ"}</button>
            <button type="button" onClick={() => setRailIndex(index => (index + 1) % Math.max(railItems.length, 1))} aria-label="Next update">›</button>
            <button className="amaana-schedule-trigger" type="button" onClick={() => setShowSchedule(value => !value)} aria-expanded={showSchedule} aria-controls="companion-schedule">Schedule</button>
          </div>
        </div>

        {showSchedule && (
          <div className="amaana-reminder-schedule" id="companion-schedule">
            <h2>Reminders for your week</h2>
            <dl>
              <div><dt>Monday & Thursday</dt><dd>Voluntary fasting, when permissible · before 18:00</dd></div>
              <div><dt>Friday</dt><dd>Al-Kahf and durood</dd></div>
              <div><dt>Every night · 20:00–04:00</dt><dd>Al-Baqarah 2:285–286 and Al-Mulk</dd></div>
              <div><dt>Morning · 04:00–10:00 / Evening · 16:00–20:00</dt><dd>Adhkar and Sayyid al-Istighfar</dd></div>
              <div><dt>Throughout the day</dt><dd>Istighfar, tasbih, takbeer, tahleel and tahmeed</dd></div>
            </dl>
            <p>All windows use Hyderabad time (IST). These are on-site reading prompts, not prayer rulings or device notifications.</p>
            <button type="button" onClick={() => { setShowSchedule(false); companionButton.current?.focus(); }}>Close schedule</button>
          </div>
        )}
      </section>

      <aside className="amaana-companion" aria-label="Amaana daily companions">
        <div className="amaana-companion-dock">
          <button
            ref={companionButton}
            type="button"
            aria-expanded={panel !== null}
            aria-controls="amaana-companion-panel"
            onClick={() => setPanel(value => value ? null : "readings")}
          >
            <span className="amaana-companion-dock-icons" aria-hidden="true"><CompanionIcon kind="book" /><CompanionIcon kind="moon" /></span>
            <span><strong>Amaana Companion</strong><small>Qur’an · Hadith · Salah · Hijri</small></span>
          </button>
        </div>

        {panel && (
          <Suspense
            fallback={
              <div
                className="amaana-companion-panel"
                id="amaana-companion-panel"
                role="status"
                aria-live="polite"
              >
                <p>Preparing companion…</p>
              </div>
            }
          >
            <IslamicCompanionPanel
              panel={panel}
              date={date}
              now={now}
              onClose={closePanel}
              onPanelChange={setPanel}
              onMoonChange={onMoonChange}
            />
          </Suspense>
        )}
      </aside>
    </>
  );
}
