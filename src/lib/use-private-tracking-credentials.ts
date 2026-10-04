"use client";

import { useState, useSyncExternalStore } from "react";
import { parsePrivateTrackingLocation, type PrivateTrackingCredentials } from "./private-tracking";

const serverSnapshot = () => undefined;

function createTrackingStore() {
  let captured: PrivateTrackingCredentials | null | undefined;
  let initialized = false;
  const read = () => {
    if (!initialized) {
      captured = parsePrivateTrackingLocation(window.location.search, window.location.hash);
      initialized = true;
    }
    return captured;
  };
  const subscribe = (notify: () => void) => {
    const update = (event: Event) => {
      // A preceding popstate render may scrub the URL before hashchange fires.
      const location = event instanceof HashChangeEvent
        ? new URL(event.newURL)
        : window.location;
      const next = parsePrivateTrackingLocation(location.search, location.hash);
      if (captured?.reference === next?.reference && captured?.token === next?.token) return;
      captured = next;
      initialized = true;
      notify();
    };
    // Next.js commits its URL after rendering the new client route. Reconcile
    // at subscription time, while retaining captured data after URL scrubbing.
    const committed = parsePrivateTrackingLocation(window.location.search, window.location.hash);
    if (committed && (captured?.reference !== committed.reference || captured?.token !== committed.token)) {
      captured = committed;
      initialized = true;
      notify();
    }
    window.addEventListener("hashchange", update);
    window.addEventListener("popstate", update);
    return () => {
      window.removeEventListener("hashchange", update);
      window.removeEventListener("popstate", update);
    };
  };
  return { read, subscribe };
}

/** Capture once before URL scrubbing; only deliberate history/fragment navigation changes it. */
export function usePrivateTrackingCredentials() {
  const [store] = useState(createTrackingStore);
  return useSyncExternalStore(store.subscribe, store.read, serverSnapshot);
}
