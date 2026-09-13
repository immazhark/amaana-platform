// Reviewed references: docs/daily-companion.md. No generated religious quotations.
export const HYDERABAD_ZONE = "Asia/Kolkata";
const DAY = 86_400_000;
const localClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: HYDERABAD_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

export function hyderabadClock(now: Date) {
  const parts = Object.fromEntries(localClock.formatToParts(now).map(part => [part.type, part.value]));
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const dayNumber = Math.floor(Date.parse(`${date}T00:00:00Z`) / DAY);
  return { date, dayNumber, weekday: new Date(dayNumber * DAY).getUTCDay(), minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

export function shiftDate(date: string, days: number) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);
}

export function timeMinutes(time: unknown): number | null {
  if (typeof time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

export const PRAYERS = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
export type Prayer = typeof PRAYERS[number];
export type PrayerDay = { date: string; timings: Record<Prayer, string> };

export function nextSalah(today: PrayerDay | null, tomorrow: PrayerDay | null, now: Date) {
  const clock = hyderabadClock(now);
  if (!today || today.date !== clock.date) return null;
  for (const prayer of PRAYERS) {
    const minute = timeMinutes(today.timings[prayer]);
    if (prayer !== "Sunrise" && minute !== null && minute > clock.minutes) {
      return { prayer, time: today.timings[prayer], tomorrow: false };
    }
  }
  if (tomorrow?.date === shiftDate(clock.date, 1) && timeMinutes(tomorrow.timings.Fajr) !== null) {
    return { prayer: "Fajr" as const, time: tomorrow.timings.Fajr, tomorrow: true };
  }
  return null;
}

export type MoonAnnouncement = {
  firstCivilDate: string; month: number; year: number; confirmedDays: number;
  authority: string; sourceUrl: string;
};
const MONTHS = ["Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani", "Jumada al-Ula", "Jumada al-Akhirah", "Rajab", "Sha’ban", "Ramadan", "Shawwal", "Dhul-Qa’dah", "Dhul-Hijjah"];

export function observedHijri(date: string, announcements: readonly MoonAnnouncement[]) {
  for (const item of announcements) {
    const first = Date.parse(`${item.firstCivilDate}T00:00:00Z`);
    if (!Number.isFinite(first) || new Date(first).toISOString().slice(0, 10) !== item.firstCivilDate ||
        !Number.isInteger(item.month) || item.month < 1 || item.month > 12 ||
        !Number.isInteger(item.year) || item.year < 1400 || item.year > 1600 ||
        ![29, 30].includes(item.confirmedDays) || !item.authority.trim() || !/^https:\/\//.test(item.sourceUrl)) continue;
    const day = Math.floor((Date.parse(`${date}T00:00:00Z`) - first) / DAY) + 1;
    if (day >= 1 && day <= item.confirmedDays) {
      return { day, month: item.month, year: item.year, label: `${day} ${MONTHS[item.month - 1]} ${item.year} AH`, authority: item.authority, sourceUrl: item.sourceUrl };
    }
  }
  return null;
}

export function estimatedHijri(date: string) {
  return new Intl.DateTimeFormat("en-GB-u-ca-islamic-civil", {
    timeZone: "UTC", day: "numeric", month: "long", year: "numeric",
  }).format(new Date(`${date}T12:00:00Z`));
}

export const AYAHS = [
  { key: "94:5", surah: "Ash-Sharh", arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", meaning: "So, surely with hardship comes ease.", excerpt: false },
  { key: "93:11", surah: "Ad-Duhaa", arabic: "وَأَمَّا بِنِعْمَةِ رَبِّكَ فَحَدِّثْ", meaning: "And proclaim the blessings of your Lord.", excerpt: false },
  { key: "2:152", surah: "Al-Baqarah", arabic: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ", meaning: "remember Me; I will remember you. And thank Me, and never be ungrateful.", excerpt: false },
  { key: "2:153", surah: "Al-Baqarah", arabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", meaning: "O believers! Seek comfort in patience and prayer. Allah is truly with those who are patient.", excerpt: false },
  { key: "55:60", surah: "Ar-Rahman", arabic: "هَلْ جَزَاءُ الْإِحْسَانِ إِلَّا الْإِحْسَانُ", meaning: "Is there any reward for goodness except goodness?", excerpt: false },
  { key: "99:7", surah: "Az-Zalzalah", arabic: "فَمَنْ يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُ", meaning: "So whoever does an atom’s weight of good will see it.", excerpt: false },
  { key: "20:114", surah: "Taha", arabic: "وَقُلْ رَبِّ زِدْنِي عِلْمًا", meaning: "My Lord! Increase me in knowledge.", excerpt: true },
] as const;

export const HADITHS = [
  { title: "A generous heart", summary: "Giving charity does not diminish wealth; forgiveness and humility are honoured by Allah.", reference: "Sahih Muslim 2588", url: "https://sunnah.com/muslim:2588", grade: "Sahih" },
  { title: "Care for one another", summary: "Faith includes wanting for your brother the good you want for yourself.", reference: "Sahih al-Bukhari 13", url: "https://sunnah.com/bukhari:13", grade: "Sahih" },
  { title: "Words of remembrance", summary: "Tasbih, tahmeed, tahleel and takbeer are among the expressions most beloved to Allah.", reference: "Sahih Muslim 2137a", url: "https://sunnah.com/muslim:2137a", grade: "Sahih" },
  { title: "Return in repentance", summary: "Sayyid al-Istighfar acknowledges Allah’s blessings and our shortcomings, asking Him for forgiveness.", reference: "Sahih al-Bukhari 6306", url: "https://sunnah.com/bukhari:6306", grade: "Sahih" },
  { title: "End the day with Qur’an", summary: "The Prophet ﷺ taught the sufficiency of reciting Al-Baqarah’s final two verses at night.", reference: "Sahih al-Bukhari 5009", url: "https://sunnah.com/bukhari:5009", grade: "Sahih" },
  { title: "Remember the Prophet ﷺ", summary: "Friday is a special occasion to increase prayers of blessing upon the Prophet ﷺ.", reference: "Sunan Abi Dawud 1047", url: "https://sunnah.com/abudawud:1047", grade: "Sahih · Al-Albani" },
  { title: "The virtue of Al-Mulk", summary: "A narration describes the thirty-verse Surah Al-Mulk interceding for its reciter until forgiveness.", reference: "Jami at-Tirmidhi 2891", url: "https://sunnah.com/tirmidhi:2891", grade: "Hasan · Darussalam" },
] as const;

export function dailyReading(now: Date) {
  const { dayNumber, date } = hyderabadClock(now);
  return { date, ayah: AYAHS[((dayNumber % AYAHS.length) + AYAHS.length) % AYAHS.length], hadith: HADITHS[((dayNumber % HADITHS.length) + HADITHS.length) % HADITHS.length] };
}

export type Reminder = { id: string; title: string; text: string; reference: string; source: string; readUrl?: string };
function avoidVoluntaryFast(date: string, confirmed: { day: number; month: number } | null) {
  const excluded = ({ day, month }: { day: number; month: number }) => month === 9 || (month === 10 && day === 1) || (month === 12 && day >= 10 && day <= 13);
  if (confirmed) return excluded(confirmed);
  // In the absence of a local announcement, suppress prompts near estimated
  // Ramadan/Eid/Tashreeq dates too. This does not certify the fallback calendar.
  const formatter = new Intl.DateTimeFormat("en-GB-u-ca-islamic-civil", { timeZone: "UTC", day: "numeric", month: "numeric" });
  return [-1, 0, 1].some(offset => {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(`${shiftDate(date, offset)}T12:00:00Z`)).map(p => [p.type, p.value]));
    return excluded({ day: Number(parts.day), month: Number(parts.month) });
  });
}
export function remindersFor(now: Date, hijri: { day: number; month: number } | null = null): Reminder[] {
  const { date, weekday, minutes } = hyderabadClock(now);
  const reminders: Reminder[] = [];
  // Clock windows are editorial reminders, not religious definitions of prayer/adhkar times.
  if ((weekday === 1 || weekday === 4) && minutes < 18 * 60 && !avoidVoluntaryFast(date, hijri)) {
    reminders.push({ id: "fasting", title: "Monday & Thursday fasting", text: "A reminder for those able to observe a voluntary fast, when permissible. Never fast on Eid; follow local guidance for festival days and personal circumstances.", reference: "Tirmidhi 747 · Hasan", source: "https://sunnah.com/tirmidhi:747" });
  }
  if (weekday === 5) {
    reminders.push({ id: "kahf", title: "Friday · Surah Al-Kahf", text: "Set aside time to read Surah Al-Kahf this Friday.", reference: "Mishkat 2175 · Hasan (Al-Albani)", source: "https://sunnah.com/mishkat:2175", readUrl: "https://quran.com/18" });
    reminders.push({ id: "durood", title: "Friday · Durood & salutations", text: "Make room for more prayers of blessing upon the Prophet ﷺ today.", reference: "Abu Dawud 1047 · Sahih (Al-Albani)", source: "https://sunnah.com/abudawud:1047" });
  }
  if (minutes >= 20 * 60 || minutes < 4 * 60) {
    reminders.push({ id: "baqarah", title: "Tonight · Al-Baqarah’s final verses", text: "Before resting, read Al-Baqarah 2:285–286.", reference: "Bukhari 5009 · Sahih", source: "https://sunnah.com/bukhari:5009", readUrl: "https://quran.com/2/285-286" });
    reminders.push({ id: "mulk", title: "Tonight · Surah Al-Mulk", text: "Make time for Surah Al-Mulk. This is a reading reminder; the linked narration concerns the surah’s virtue, not a prescribed bedtime.", reference: "Tirmidhi 2891 · Hasan", source: "https://sunnah.com/tirmidhi:2891", readUrl: "https://quran.com/67" });
  }
  if ((minutes >= 4 * 60 && minutes < 10 * 60) || (minutes >= 16 * 60 && minutes < 20 * 60)) {
    reminders.push({ id: "adhkar", title: minutes < 10 * 60 ? "Morning adhkar" : "Evening adhkar", text: "Pause for remembrance and Sayyid al-Istighfar. Open the reference for the supplication and its context.", reference: "Bukhari 6306 · Sahih", source: "https://sunnah.com/bukhari:6306" });
  }
  reminders.push({ id: "istighfar", title: "A moment of istighfar", text: "Astaghfirullah — I ask Allah for forgiveness. Return to Him with sincerity.", reference: "Bukhari 6306 · Sahih", source: "https://sunnah.com/bukhari:6306" });
  reminders.push({ id: "dhikr", title: "Remember Allah throughout the day", text: "SubhanAllah · Alhamdulillah · La ilaha illallah · Allahu Akbar. Tasbih, tahmeed, tahleel and takbeer.", reference: "Muslim 2137a · Sahih", source: "https://sunnah.com/muslim:2137a" });
  return reminders;
}
