import { NextResponse } from "next/server";
import { readTextBodyWithLimit } from "@/lib/bounded-request-body";
import { HYDERABAD_ZONE, PRAYERS, hyderabadClock, observedHijri, shiftDate, timeMinutes, type PrayerDay } from "@/lib/daily-companion";
import sightings from "@/data/hyderabad-moonsighting.json";

export const dynamic = "force-dynamic";

// Prayer-provider JSON is small. Reject outlier bodies before parsing to keep
// this unauthenticated endpoint bounded when the external service misbehaves.
const MAX_PRAYER_PROVIDER_RESPONSE_BYTES = 32 * 1024;
const PRAYER_PROVIDER_READ_TIMEOUT_MS = 8_000;

async function loadPrayerDay(date: string, school: string): Promise<PrayerDay> {
  const providerDate = date.split("-").reverse().join("-");
  const params = new URLSearchParams({ latitude: "17.3850", longitude: "78.4867", method: "1", school, timezonestring: HYDERABAD_ZONE });
  const response = await fetch(`https://api.aladhan.com/v1/timings/${providerDate}?${params}`, {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(PRAYER_PROVIDER_READ_TIMEOUT_MS),
    redirect: "error",
  });
  if (!response.ok) throw new Error("Prayer provider unavailable");
  const rawBody = await readTextBodyWithLimit(response, MAX_PRAYER_PROVIDER_RESPONSE_BYTES, {
    timeoutMs: PRAYER_PROVIDER_READ_TIMEOUT_MS,
  });
  const payload: unknown = JSON.parse(rawBody);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Prayer provider returned invalid data");
  }
  const data = payload as {
    code?: unknown;
    data?: {
      date?: { gregorian?: { date?: unknown } };
      meta?: { timezone?: unknown };
      timings?: Record<string, unknown>;
    };
  };
  if (data.code !== 200 || data.data?.date?.gregorian?.date !== providerDate ||
      data.data?.meta?.timezone !== HYDERABAD_ZONE) throw new Error("Prayer provider returned a different day or timezone");
  const timings = {} as PrayerDay["timings"];
  for (const prayer of PRAYERS) {
    const raw = data.data.timings?.[prayer];
    const value = typeof raw === "string" ? raw.split(" ")[0] : null;
    if (timeMinutes(value) === null) throw new Error("Incomplete prayer times");
    timings[prayer] = value as string;
  }
  return { date, timings };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const school = params.get("school") ?? "1";
  if (!["0", "1"].includes(school)) return NextResponse.json({ error: "Choose a supported Asr calculation." }, { status: 400 });
  // This endpoint intentionally serves Hyderabad, not visitor coordinates.
  if (params.has("lat") || params.has("lon")) return NextResponse.json({ error: "This widget provides Hyderabad, India timings. No location permission is needed." }, { status: 400 });
  const { date } = hyderabadClock(new Date());
  const tomorrowDate = shiftDate(date, 1);
  const [today, tomorrow] = await Promise.allSettled([loadPrayerDay(date, school), loadPrayerDay(tomorrowDate, school)]);
  if (today.status !== "fulfilled") {
    return NextResponse.json({ error: "Prayer times are temporarily unavailable. Please follow your local masjid timetable, or try again." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json({
    today: today.value, tomorrow: tomorrow.status === "fulfilled" ? tomorrow.value : null,
    timezone: HYDERABAD_ZONE, city: "Hyderabad, India", school,
    method: "University of Islamic Sciences, Karachi", asr: school === "1" ? "Hanafi" : "Standard (Shafi, Maliki, Hanbali)",
    moon: observedHijri(date, sightings.announcements), eveningMoon: observedHijri(tomorrowDate, sightings.announcements),
    note: "Calculated prayer start times, not congregation times. Follow your local masjid where its timetable differs.",
  }, { headers: { "Cache-Control": "no-store" } });
}
