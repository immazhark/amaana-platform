import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

const tracking = vi.hoisted(() => {
  const credentials = { reference: "AFR-SYNTHETIC-001", token: "synthetic-private-tracking-token" };
  return {
    credentials,
    snapshot: {
      credentials,
      record: {
        found: true as const,
        status: "UNDER_VERIFICATION" as const,
        createdAt: "2026-10-26T19:00:00.000Z",
        updatedAt: "2026-10-26T20:00:00.000Z",
      },
      failed: false,
      rateLimited: false,
    },
  };
});

vi.mock("@/lib/use-private-tracking-credentials", () => ({
  usePrivateTrackingCredentials: () => tracking.credentials,
}));
vi.mock("react", async importOriginal => ({
  ...await importOriginal<typeof import("react")>(),
  useState: (initial: unknown) => [initial === undefined ? tracking.snapshot : initial, vi.fn()],
  useEffect: () => {},
}));

import { AssistanceStatusClient } from "./assistance-status-client";

it("shows private tracking dates in India even when the visitor's timezone is UTC", () => {
  // Emulate a UTC device only where no explicit timezone is supplied.
  const dateSpy = vi.spyOn(Date.prototype, "toLocaleDateString").mockImplementation(function (this: Date, locales, options) {
    return new Intl.DateTimeFormat(locales, { ...options, timeZone: options?.timeZone ?? "UTC" }).format(this);
  });
  try {
    const markup = renderToStaticMarkup(<AssistanceStatusClient />);
    expect(markup).toContain("Submitted 27 October 2026 · Last updated 27 October 2026");
  } finally {
    dateSpy.mockRestore();
  }
});
