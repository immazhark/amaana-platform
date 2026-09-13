# Amaana daily companions

User priority on 2026-09-13: add these companions before resuming the remaining campaign archive work. Extend the current public-site identity; do not change main, donation handling, authentication or recipient-publication rules.

## Direction contract

THESIS: Two small, independent reading and prayer controls offer useful faith content without turning the charity site into a dashboard.

OWN-WORLD: Existing Amaana deep teal/ink, warm light surfaces and restrained gold focus outlines. Inherited serif reading headings and plain utility controls; no new identity.

STORY: Read a sourced ayah and hadith, check Hyderabad prayer times, and recognise whether a Hijri date is locally confirmed or estimated.

FIRST VIEWPORT: A compact reminder section below navigation; two labelled bottom-corner controls open one nonmodal, scrollable panel at a time. Campaign imagery remains the main-page subject.

FORM: Precisely requested extension, code-led; no concept seed or replacement-world exercise. Reminders are initially still, with opt-in 14-second auto-play, explicit pause, focus/hover pause, and no automatic rotation under reduced-motion preference. Escape closes a panel and restores its trigger focus without scrolling.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Content and behaviour

- A seven-selection Qur’an library and seven hadith meaning summaries rotate at midnight in Asia/Kolkata. They are bundled, not generated at runtime. The 20:114 selection is an explicitly labelled excerpt. Arabic uses ordinary Arabic orthography, not a claim of exact Uthmani typesetting.
- English Qur’an excerpts: Dr. Mustafa Khattab, The Clear Quran, attributed and linked. Each source page contributes a short excerpt under 25 words. Hadith content is clearly labelled a meaning summary, with collection, number and available grading.
- Read/listen/tafsir links open Quran.com. No embedded autoplay or audio service dependence. Copy includes reference URLs, never the incorrect sample domain amaana.org.
- Fixed Hyderabad coordinates 17.3850, 78.4867. No geolocation request or collection. AlAdhan method 1; Hanafi default with Standard Asr option. Provider responses are cached for an hour, but validated against the requested civil date and timezone. Today/tomorrow fetched in parallel. No fabricated next-day Fajr.
- API failures retain daily readings and an explicitly labelled civil-calendar estimate; timings offer retry and advise the local masjid. API failures never produce fake prayer times.
- Reminders: Monday/Thursday before 18:00; Friday; night 20:00–04:00; morning 04:00–10:00; evening 16:00–20:00; general dhikr always. These are editorial IST display windows, not fiqh definitions. No push notifications or background scheduling.
- A confirmed Ramadan, Eid or Tashreeq civil date suppresses voluntary-fasting prompts. Without confirmation, the estimated date plus a one-day buffer suppresses them too. Otherwise prompts are conditional on permissibility and explicitly exclude Eid; visitors should follow local guidance.

## Hyderabad moonsighting — unresolved input, not a computed offset

No current Hyderabad authority announcement has been verified. `src/data/hyderabad-moonsighting.json` therefore has no production announcements. **Do not insert the test fixtures as real data.** The visible fallback is Islamic Civil/tabular, explicitly not a locally confirmed calendar. A general Saudi or other-country date must not be relabelled Hyderabad.

To add an approved announcement, append an object with `firstCivilDate` (YYYY-MM-DD, the daylight date of day 1 in Hyderabad), numeric `month` and `year`, `confirmedDays: 29`, `authority` and an HTTPS `sourceUrl`. The Islamic day starts at Maghrib on the preceding civil evening. The widget switches to the following civil day's Hijri label at today's calculated Hyderabad Maghrib. Once day 29 ends, a new announcement is required; only set `confirmedDays: 30` after verified completion of 30 days. Do not extrapolate into the next month. A reviewed code update publishes these records; there is no unauthenticated write endpoint.

The authority link/image has been requested from the user. This part is **not completed as confirmed local moonsighting** until that input is supplied and verified.

## Verified references (2026-09-13)

Qur’an: https://quran.com/ash-sharh/5 · https://quran.com/ad-duhaa/11 · https://quran.com/al-baqarah/152 · https://quran.com/al-baqarah/153 · https://quran.com/ar-rahman/60 · https://quran.com/az-zalzalah/7 · https://quran.com/taha/114

Hadith and reminders: https://sunnah.com/bukhari:13 · https://sunnah.com/muslim:2588 · https://sunnah.com/muslim:2137a · https://sunnah.com/bukhari:6306 · https://sunnah.com/bukhari:5009 · https://sunnah.com/abudawud:1047 · https://sunnah.com/tirmidhi:2891 · https://sunnah.com/tirmidhi:747 · https://sunnah.com/mishkat:2175

The bedtime narration at https://sunnah.com/tirmidhi:2892 is graded Da’if (Darussalam) on that page. It is not presented as an established authentic bedtime prescription. The Al-Mulk reminder links the Hasan narration 2891 about the surah's virtue and makes that distinction in its text.

Prayer provider: https://aladhan.com/calculation-methods and https://aladhan.com/prayer-times-api. Calculated start times are not congregation/iqamah times.

## Verification

`node --experimental-strip-types --test scripts/test-daily-companion.mjs` covers deterministic local-day selection, weekday and time-window boundaries, known prohibited fasting dates, next-day Fajr, stale-day refusal, malformed times, moon-announcement expiry and date arithmetic. CI runs this before the existing lint/typecheck/test/build checks.

Deployment and browser verification are recorded separately once completed. The remaining campaign archive stays at 23 of 366 files visually reviewed; this widget work does not advance that count.
