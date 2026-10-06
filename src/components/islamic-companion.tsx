"use client";

import Link from "next/link";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
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
  detailsHref: string;
  supportHref: string;
  detailsCta: string;
  supportCta: string;
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
  const [reducedMotion, setReducedMotion] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
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
  const activeReminder = reminders[0];
  const activeLiveItem = liveItems.length ? liveItems[railIndex % liveItems.length] : null;

  useEffect(() => {
    if (reducedMotion || hovered || focused || panel || liveItems.length < 2) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setRailIndex(index => index + 1);
    }, 12_000);
    return () => window.clearInterval(timer);
  }, [focused, hovered, panel, reducedMotion, liveItems.length]);

  const closePanel = useCallback(() => {
    setPanel(null);
    companionButton.current?.focus({ preventScroll: true });
  }, []);

  const onMoonChange = useCallback((value: MoonState) => {
    if (!value.date) return;
    setConfirmedMoon(value);
  }, []);

  return (
    <>
      <section
        className="amaana-reminders"
        aria-label="Amaana reminder and live updates"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={event => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
        }}
      >
        <div className="amaana-reminder-inner">
          <div className="amaana-reminder-lane" role="group" aria-label="Current reminder">
            <span className="amaana-rail-label">Reminder</span>
            <div className="amaana-reminder-content" aria-live="polite" aria-atomic="true">
              <strong>{activeReminder?.title ?? "A moment for remembrance"}</strong>
              <p>{activeReminder?.text ?? "Daily readings and gentle reminders, on Hyderabad time."}</p>
              {activeReminder && <a className="amaana-reminder-source" href={activeReminder.source} target="_blank" rel="noopener noreferrer">{activeReminder.reference}</a>}
            </div>
          </div>

          <div className="amaana-live-lane" role="group" aria-label="Amaana live updates">
            <span className="amaana-live-badge"><span aria-hidden="true" />AMAANA LIVE</span>
            {activeLiveItem ? (
              <div className="amaana-live-content" key={activeLiveItem.id} aria-live="polite" aria-atomic="true">
                <span className="amaana-reminder-eyebrow">{activeLiveItem.eyebrow}</span>
                <strong>{activeLiveItem.title}</strong>
                <span className="amaana-live-actions">
                  <Link className="amaana-live-link" href={activeLiveItem.detailsHref}>{activeLiveItem.detailsCta}</Link>
                  <Link className="amaana-live-cta" href={activeLiveItem.supportHref}>{activeLiveItem.supportCta}<span aria-hidden="true"> →</span></Link>
                </span>
              </div>
            ) : (
              <div className="amaana-live-content">
                <span className="amaana-reminder-eyebrow">Foundation updates</span>
                <strong>No public appeal is open right now.</strong>
                <span className="amaana-live-actions">
                  <Link className="amaana-live-cta" href="/our-work">Explore our work<span aria-hidden="true"> →</span></Link>
                </span>
              </div>
            )}
          </div>
        </div>
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
