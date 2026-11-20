/**
 * Hijri dates via the Umm al-Qura calendar tables built into the platform
 * Intl implementation. The app labels these as calendar estimates: the start of
 * an Islamic month is confirmed by local moon sighting.
 */
export interface HijriDate {
  day: number;
  month: number;
  year: number;
  monthName: string;
  formatted: string;
}

const AR_MONTHS = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الآخر',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة',
];

const EN_MONTHS = [
  'Muharram',
  'Safar',
  "Rabi' al-Awwal",
  "Rabi' al-Thani",
  'Jumada al-Ula',
  'Jumada al-Akhirah',
  'Rajab',
  "Sha'ban",
  'Ramadan',
  'Shawwal',
  "Dhu al-Qi'dah",
  'Dhu al-Hijjah',
];

export const HIJRI_MONTHS = { en: EN_MONTHS, ar: AR_MONTHS };

export function hijriDate(date: Date, lang = 'en'): HijriDate | null {
  try {
    const locale = lang === 'ar' ? 'ar-SA-u-ca-islamic-umalqura' : 'en-u-ca-islamic-umalqura';
    const parts = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }).formatToParts(date);
    const get = (t: string) => parts.find((p) => p.type === t)?.value || '';
    const day = parseInt(get('day').replace(/[^\d]/g, ''), 10);
    const month = parseInt(get('month').replace(/[^\d]/g, ''), 10);
    const year = parseInt(get('year').replace(/[^\d]/g, ''), 10);
    if (!day || !month || !year) return null;
    const monthName = lang === 'ar' ? AR_MONTHS[month - 1] : EN_MONTHS[month - 1];
    return { day, month, year, monthName, formatted: `${day} ${monthName} ${year} AH` };
  } catch {
    return null;
  }
}

export interface Occasion {
  month: number;
  day: number;
  title: string;
  titleAr: string;
  note?: string;
}

/** Fixed Hijri observances (dates that depend on moon sighting are labelled). */
export const OCCASIONS: Occasion[] = [
  { month: 1, day: 1, title: 'Islamic New Year', titleAr: 'رأس السنة الهجرية' },
  { month: 1, day: 10, title: 'Day of Ashura', titleAr: 'يوم عاشوراء', note: 'Voluntary fast' },
  { month: 3, day: 12, title: 'Mawlid (12 Rabi al-Awwal)', titleAr: 'المولد النبوي', note: 'Observed by many communities; date varies by moon sighting' },
  { month: 7, day: 27, title: 'Isra and Mi\u2019raj', titleAr: 'الإسراء والمعراج' },
  { month: 8, day: 15, title: 'Mid-Sha\u2019ban', titleAr: 'ليلة النصف من شعبان' },
  { month: 9, day: 1, title: 'First day of Ramadan (moon sighting)', titleAr: 'أول يوم من رمضان', note: 'Confirmed by local moon sighting' },
  { month: 9, day: 27, title: 'Laylat al-Qadr (expected)', titleAr: 'ليلة القدر', note: 'Seek it in the last ten odd nights' },
  { month: 10, day: 1, title: 'Eid al-Fitr (moon sighting)', titleAr: 'عيد الفطر', note: 'Confirmed by local moon sighting' },
  { month: 12, day: 9, title: 'Day of Arafah', titleAr: 'يوم عرفة' },
  { month: 12, day: 10, title: 'Eid al-Adha (moon sighting)', titleAr: 'عيد الأضحى', note: 'Confirmed by local moon sighting' },
];

export function isRamadan(h: HijriDate | null): boolean {
  return Boolean(h && h.month === 9);
}

export function upcomingOccasions(h: HijriDate | null, count = 4): Occasion[] {
  if (!h) return OCCASIONS.slice(0, count);
  const key = h.month * 100 + h.day;
  const later = OCCASIONS.filter((o) => o.month * 100 + o.day >= key);
  return [...later, ...OCCASIONS].slice(0, count);
}

export function gregorianDate(date: Date, lang = 'en'): string {
  const locale = lang === 'ar' ? 'ar-SA' : lang === 'so' ? 'so-SO' : 'en-GB';
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return date.toDateString();
  }
}

/** Days in the current Hijri month, for calendar grids. */
export function hijriMonthLength(date: Date): number {
  const start = hijriDate(date);
  if (!start) return 30;
  for (let d = 1; d <= 31; d++) {
    const probe = new Date(date.getTime() + d * 86400000);
    const h = hijriDate(probe);
    if (!h || h.month !== start.month) return d;
  }
  return 30;
}
