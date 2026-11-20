import {
  Coordinates,
  CalculationMethod,
  CalculationParameters,
  PrayerTimes,
  Madhab,
  HighLatitudeRule,
  Qibla,
} from 'adhan';

export type PrayerKey = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export const PRAYER_KEYS: PrayerKey[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
export const FIVE: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export type MethodId =
  | 'MWL'
  | 'UmmAlQura'
  | 'Egyptian'
  | 'Karachi'
  | 'ISNA'
  | 'Diyanet'
  | 'Dubai'
  | 'Kuwait'
  | 'Qatar'
  | 'Singapore'
  | 'MoonsightingCommittee'
  | 'Tehran';

export const METHODS: { id: MethodId; label: string; note?: string }[] = [
  { id: 'MWL', label: 'Muslim World League', note: 'Default worldwide' },
  { id: 'UmmAlQura', label: 'Umm al-Qura (Makkah)' },
  { id: 'Egyptian', label: 'Egyptian General Authority' },
  { id: 'Karachi', label: 'University of Islamic Sciences, Karachi' },
  { id: 'ISNA', label: 'Islamic Society of North America' },
  { id: 'Diyanet', label: 'Diyanet İşleri (Türkiye)' },
  { id: 'Dubai', label: 'Dubai (UAE)' },
  { id: 'Kuwait', label: 'Kuwait' },
  { id: 'Qatar', label: 'Qatar' },
  { id: 'Singapore', label: 'Singapore / MUIS' },
  { id: 'MoonsightingCommittee', label: 'Moonsighting Committee' },
  { id: 'Tehran', label: 'Institute of Geophysics, Tehran' },
];

export type HighLat = 'MiddleOfTheNight' | 'SeventhOfTheNight' | 'TwilightAngle';

export const HIGH_LAT: { id: HighLat; label: string }[] = [
  { id: 'MiddleOfTheNight', label: 'Middle of the night' },
  { id: 'SeventhOfTheNight', label: 'One seventh of the night' },
  { id: 'TwilightAngle', label: 'Angle based (recommended)' },
];

export interface Place {
  lat: number;
  lon: number;
  city: string;
  region?: string;
  country: string;
  countryCode: string;
  flag?: string;
  timezone: string;
  manual: boolean;
}

export interface CalcOptions {
  method: MethodId;
  madhab: 'shafi' | 'hanafi';
  highLatitude: HighLat;
  /** Per-prayer minute tuning used to match a local mosque. */
  adjustments?: Partial<Record<PrayerKey, number>>;
}

function baseParams(method: MethodId): CalculationParameters {
  switch (method) {
    case 'UmmAlQura':
      return CalculationMethod.UmmAlQura();
    case 'Egyptian':
      return CalculationMethod.Egyptian();
    case 'Karachi':
      return CalculationMethod.Karachi();
    case 'ISNA':
      return CalculationMethod.NorthAmerica();
    case 'Diyanet':
      return CalculationMethod.Turkey();
    case 'Dubai':
      return CalculationMethod.Dubai();
    case 'Kuwait':
      return CalculationMethod.Kuwait();
    case 'Qatar':
      return CalculationMethod.Qatar();
    case 'Singapore':
      return CalculationMethod.Singapore();
    case 'MoonsightingCommittee':
      return CalculationMethod.MoonsightingCommittee();
    case 'Tehran':
      return CalculationMethod.Tehran();
    case 'MWL':
    default:
      return CalculationMethod.MuslimWorldLeague();
  }
}

export function buildParams(opts: CalcOptions): CalculationParameters {
  const params = baseParams(opts.method);
  params.madhab = opts.madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  params.highLatitudeRule =
    opts.highLatitude === 'SeventhOfTheNight'
      ? HighLatitudeRule.SeventhOfTheNight
      : opts.highLatitude === 'TwilightAngle'
        ? HighLatitudeRule.TwilightAngle
        : HighLatitudeRule.MiddleOfTheNight;
  if (opts.adjustments) {
    const a = opts.adjustments;
    params.adjustments = {
      fajr: a.fajr || 0,
      sunrise: a.sunrise || 0,
      dhuhr: a.dhuhr || 0,
      asr: a.asr || 0,
      maghrib: a.maghrib || 0,
      isha: a.isha || 0,
    };
  }
  return params;
}

export function computeDay(date: Date, place: Place, opts: CalcOptions): Record<PrayerKey, Date> {
  const times = new PrayerTimes(
    new Coordinates(place.lat, place.lon),
    date,
    buildParams(opts)
  );
  return {
    fajr: times.fajr,
    sunrise: times.sunrise,
    dhuhr: times.dhuhr,
    asr: times.asr,
    maghrib: times.maghrib,
    isha: times.isha,
  };
}

export function nextPrayer(
  times: Record<PrayerKey, Date>,
  now = new Date()
): { key: PrayerKey; at: Date; msLeft: number; tomorrow: boolean } {
  for (const key of PRAYER_KEYS) {
    if (times[key].getTime() > now.getTime()) {
      return { key, at: times[key], msLeft: times[key].getTime() - now.getTime(), tomorrow: false };
    }
  }
  const fajr = times.fajr;
  const next = new Date(fajr.getTime() + 24 * 3600 * 1000);
  return { key: 'fajr', at: next, msLeft: next.getTime() - now.getTime(), tomorrow: true };
}

export function currentPrayer(times: Record<PrayerKey, Date>, now = new Date()): PrayerKey | null {
  let current: PrayerKey | null = null;
  for (const key of FIVE) {
    if (times[key].getTime() <= now.getTime()) current = key;
  }
  return current;
}

export function qiblaBearing(lat: number, lon: number): number {
  return Qibla(new Coordinates(lat, lon));
}

/** Format an instant in the place's own timezone. */
export function formatTime(date: Date, timezone: string, lang = 'en', hour12 = true): string {
  const locale = lang === 'ar' ? 'ar-SA' : lang === 'so' ? 'so-SO' : 'en-GB';
  try {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12,
      timeZone: timezone,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(date);
  }
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** Local calendar date (YYYY-MM-DD) for a place, used for scheduling. */
export function dayKey(date: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: timezone,
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}
