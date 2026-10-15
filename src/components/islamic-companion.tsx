"use client";

import Link from "@/components/navigation-link";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { hyderabadClock, remindersFor } from "@/lib/daily-companion";
import { readLiveRailResponse, type LiveRailItem } from "@/lib/live-rail-response";
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
  const [railState, setRailState] = useState<"loading" | "ready" | "unavailable">("loading");
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
    let startupTimeout: number | undefined;
    let idleHandle: number | undefined;
    let disposed = false;
    let activeController: AbortController | null = null;
    let lastRequestedAt: number | null = null;
    let hasRequested = false;
    let hasLiveAppeals = false;
    const idleWindow = window as Window & typeof globalThis & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    const load = () => {
      if (disposed || document.hidden || activeController) return;
      const requestedAt = Date.now();
      if (lastRequestedAt !== null && requestedAt - lastRequestedAt < 5 * 60_000) return;
      lastRequestedAt = requestedAt;

      const controller = new AbortController();
      activeController = controller;
      // An appeal can be withdrawn while a tab stays open. Never preserve
      // a stale donation shortcut while validating a fresh response.
      if (hasRequested) {
        setLiveItems([]);
        setRailIndex(0);
        setRailState("loading");
      }
      hasRequested = true;
      const requestTimeout = window.setTimeout(() => {
        controller.abort();
        if (activeController === controller) activeController = null;
        hasLiveAppeals = false;
        if (!disposed) setRailState("unavailable");
      }, 8000);

      void fetch("/api/public/live-rail", { cache: "no-store", signal: controller.signal })
        .then(async response => {
          if (!response.ok) throw new Error("Public updates unavailable");
          const payload: unknown = await response.json();
          const items = readLiveRailResponse(payload);
          if (!items) throw new Error("Invalid public updates");
          return items;
        })
        .then(items => {
          if (!disposed && activeController === controller && !controller.signal.aborted) {
            hasLiveAppeals = items.length > 0;
            setLiveItems(items);
            setRailIndex(0);
            setRailState("ready");
          }
        })
        .catch(() => {
          if (!disposed && activeController === controller) {
            hasLiveAppeals = false;
            setRailState("unavailable");
          }
        })
        .finally(() => {
          window.clearTimeout(requestTimeout);
          if (activeController === controller) activeController = null;
        });
    };

    const refreshIfVisible = () => {
      if (!document.hidden) load();
    };
    if (idleWindow.requestIdleCallback) {
      idleHandle = idleWindow.requestIdleCallback(load, { timeout: 1800 });
    } else {
      startupTimeout = window.setTimeout(load, 900);
    }
    // Check only while promoting live appeals. An empty/unavailable rail
    // refreshes when the visitor returns, avoiding idle DB work on pages
    // where no public appeal is open.
    const refreshTimer = window.setInterval(() => {
      if (hasLiveAppeals) refreshIfVisible();
    }, 60_000);
    document.addEventListener("visibilitychange", refreshIfVisible);

    return () => {
      disposed = true;
      activeController?.abort();
      window.clearInterval(refreshTimer);
      document.removeEventListener("visibilitychange", refreshIfVisible);
      if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle);
      if (startupTimeout !== undefined) window.clearTimeout(startupTimeout);
    };
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
              <div className="amaana-live-content" aria-live="polite" aria-atomic="true">
                <span className="amaana-reminder-eyebrow">Foundation updates</span>
                <strong>{railState === "ready" ? "No public appeal is open right now." : railState === "loading" ? "Checking public appeal updates…" : "Public appeal updates are unavailable."}</strong>
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
