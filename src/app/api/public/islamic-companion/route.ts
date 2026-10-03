import { NextResponse } from "next/server";
import { HYDERABAD_ZONE, PRAYERS, hyderabadClock, observedHijri, shiftDate, timeMinutes, type PrayerDay } from "@/lib/daily-companion";
import sightings from "@/data/hyderabad-moonsighting.json";

export const dynamic = "force-dynamic";

async function loadPrayerDay(date: string, school: string): Promise<PrayerDay> {
  const providerDate = date.split("-").reverse().join("-");
  const params = new URLSearchParams({ latitude: "17.3850", longitude: "78.4867", method: "1", school, timezonestring: HYDERABAD_ZONE });
  const response = await fetch(`https://api.aladhan.com/v1/timings/${providerDate}?${params}`, {
    next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Prayer provider unavailable");
  const payload = await response.json();
  if (payload.code !== 200 || payload.data?.date?.gregorian?.date !== providerDate ||
      payload.data?.meta?.timezone !== HYDERABAD_ZONE) throw new Error("Prayer provider returned a different day or timezone");
  const timings = {} as PrayerDay["timings"];
  for (const prayer of PRAYERS) {
    const raw = payload.data.timings?.[prayer];
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
