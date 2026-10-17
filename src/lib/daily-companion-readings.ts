// Reviewed reading content, loaded only when the Companion panel opens.
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

export function dailyReading({ dayNumber, date }: { dayNumber: number; date: string }) {
  const ayahIndex = ((dayNumber % AYAHS.length) + AYAHS.length) % AYAHS.length;
  const hadithIndex = ((dayNumber % HADITHS.length) + HADITHS.length) % HADITHS.length;
  return {
    date,
    ayah: AYAHS[ayahIndex] ?? AYAHS[0],
    hadith: HADITHS[hadithIndex] ?? HADITHS[0],
  };
}
