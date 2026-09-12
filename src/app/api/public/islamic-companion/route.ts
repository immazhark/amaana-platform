import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const METHODS: Record<string, { id: number; label: string }> = {
  karachi: { id: 1, label: "University of Islamic Sciences, Karachi" },
  isna: { id: 2, label: "Islamic Society of North America" },
  mwl: { id: 3, label: "Muslim World League" },
  egypt: { id: 5, label: "Egyptian General Authority of Survey" },
};

function coordinate(value: string | null, min: number, max: number) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

function cleanTime(value: unknown) {
  return typeof value === "string" ? value.replace(/\s*\([^)]*\)\s*$/, "") : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const latitude = coordinate(url.searchParams.get("lat"), -90, 90);
  const longitude = coordinate(url.searchParams.get("lon"), -180, 180);
  const methodKey = url.searchParams.get("method") ?? "karachi";
  const method = METHODS[methodKey] ?? METHODS.karachi;

  if (latitude === null || longitude === null) {
    return NextResponse.json({ error: "Valid latitude and longitude are required." }, { status: 400 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const upstream = new URL(`https://api.aladhan.com/v1/timings/${timestamp}`);
  upstream.searchParams.set("latitude", String(latitude));
  upstream.searchParams.set("longitude", String(longitude));
  upstream.searchParams.set("method", String(method.id));
  upstream.searchParams.set("school", "1");

  try {
    const response = await fetch(upstream, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`Prayer-time provider returned ${response.status}`);

    const payload = await response.json() as {
      data?: {
        timings?: Record<string, string>;
        date?: { readable?: string; hijri?: { date?: string; day?: string; month?: { en?: string }; year?: string; weekday?: { en?: string } } };
        meta?: { timezone?: string };
      };
    };

    const data = payload.data;
    if (!data?.timings || !data.date?.hijri) throw new Error("Prayer-time provider returned an incomplete response");

    return NextResponse.json({
      hijri: {
        date: data.date.hijri.date ?? null,
        day: data.date.hijri.day ?? null,
        month: data.date.hijri.month?.en ?? null,
        year: data.date.hijri.year ?? null,
        weekday: data.date.hijri.weekday?.en ?? null,
      },
      gregorian: data.date.readable ?? null,
      timezone: data.meta?.timezone ?? null,
      method: method.label,
      school: "Hanafi Asr",
      timings: {
        Fajr: cleanTime(data.timings.Fajr),
        Sunrise: cleanTime(data.timings.Sunrise),
        Dhuhr: cleanTime(data.timings.Dhuhr),
        Asr: cleanTime(data.timings.Asr),
        Maghrib: cleanTime(data.timings.Maghrib),
        Isha: cleanTime(data.timings.Isha),
      },
      note: "Calculated prayer times can differ from local mosque timetables and local moon-sighting practice.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Islamic companion provider error", error);
    return NextResponse.json({ error: "Prayer times are temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
