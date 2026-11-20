import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { get, patch, post, local } from './api';
import { dirOf, translate, type Lang } from './i18n';
import {
  computeDay,
  nextPrayer as computeNext,
  formatCountdown,
  FIVE,
  type CalcOptions,
  type Place,
  type PrayerKey,
} from './prayer';
import { hijriDate, type HijriDate } from './hijri';

export interface Prefs {
  notifyEnabled: boolean;
  prayerAlerts: Record<string, boolean>;
  preReminder: number; // minutes before, 0 = off
  athanSound: string;
  dailyQuran: boolean;
  dailyDua: boolean;
  dailyHadith: boolean;
  quranFontSize: number;
  hour12: boolean;
}

export const DEFAULT_PREFS: Prefs = {
  notifyEnabled: false,
  prayerAlerts: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
  preReminder: 0,
  athanSound: 'makkah',
  dailyQuran: true,
  dailyDua: false,
  dailyHadith: false,
  quranFontSize: 28,
  hour12: true,
};

export interface User {
  id: string;
  email: string;
  name: string;
  lang: Lang;
  theme: 'light' | 'dark';
  role: string;
  emailVerified: boolean;
  prefs: Partial<Prefs>;
  createdAt: string;
}

type LocState = 'idle' | 'locating' | 'granted' | 'denied' | 'error';

interface Toast {
  id: number;
  message: string;
  kind: 'info' | 'success' | 'error';
}

interface Store {
  lang: Lang;
  setLang: (l: Lang) => void;
  dir: 'ltr' | 'rtl';
  t: (phrase: string) => string;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  place: Place | null;
  locState: LocState;
  locError: string;
  detectLocation: () => Promise<void>;
  setManualPlace: (p: Place) => void;
  clearPlace: () => void;
  calc: CalcOptions;
  setCalc: (c: Partial<CalcOptions>) => void;
  times: Record<PrayerKey, Date> | null;
  next: { key: PrayerKey; at: Date; msLeft: number; tomorrow: boolean } | null;
  countdown: string;
  now: Date;
  hijri: HijriDate | null;
  prefs: Prefs;
  setPrefs: (p: Partial<Prefs>) => void;
  user: User | null;
  authReady: boolean;
  setUser: (u: User | null) => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  toasts: Toast[];
  toast: (message: string, kind?: Toast['kind']) => void;
  notifyPermission: string;
  requestNotify: () => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

const DEFAULT_CALC: CalcOptions = { method: 'MWL', madhab: 'shafi', highLatitude: 'TwilightAngle' };

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => local.get<Lang>('lang', 'en'));
  const [theme, setTheme] = useState<'light' | 'dark'>(() => local.get('theme', 'light'));
  const [place, setPlace] = useState<Place | null>(() => local.get<Place | null>('place', null));
  const [locState, setLocState] = useState<LocState>(place ? (place.manual ? 'idle' : 'granted') : 'idle');
  const [locError, setLocError] = useState('');
  const [calc, setCalcState] = useState<CalcOptions>(() => local.get<CalcOptions>('calc', DEFAULT_CALC));
  const [prefs, setPrefsState] = useState<Prefs>(() => ({ ...DEFAULT_PREFS, ...local.get('prefs', {}) }));
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifyPermission, setNotifyPermission] = useState<string>(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const firedRef = useRef<Set<string>>(new Set());

  const t = useCallback((phrase: string) => translate(lang, phrase), [lang]);
  const dir = dirOf(lang);

  /* ------------------------------ persistence ------------------------------ */
  useEffect(() => {
    local.set('lang', lang);
    local.set('theme', theme);
    local.set('calc', calc);
    local.set('prefs', prefs);
    if (place) local.set('place', place);
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.documentElement.dataset.theme = theme;
  }, [lang, theme, calc, prefs, place, dir]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const toast = useCallback((message: string, kind: Toast['kind'] = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3600);
  }, []);

  /* --------------------------------- auth ---------------------------------- */
  const refreshUser = useCallback(async () => {
    try {
      const res = await get<{ user: User | null }>('/auth/me');
      const me = res.user;
      setUser(me);
      if (me) {
        setPrefsState((p) => ({ ...p, ...(me.prefs || {}) }));
      }
    } catch {
      setUser(null);
    } finally {
      setAuthReady(true);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    await post('/auth/logout');
    setUser(null);
    toast('Signed out');
  }, [toast]);

  const setLang = useCallback(
    (l: Lang) => {
      setLangState(l);
      if (user) void patch('/auth/profile', { lang: l }).catch(() => undefined);
    },
    [user]
  );

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      if (user) void patch('/auth/profile', { theme: nextTheme }).catch(() => undefined);
      return nextTheme;
    });
  }, [user]);

  const setPrefs = useCallback(
    (p: Partial<Prefs>) => {
      setPrefsState((prev) => {
        const merged = { ...prev, ...p };
        if (user) {
          void patch('/auth/profile', { prefs: merged }).catch(() => undefined);
        }
        return merged;
      });
    },
    [user]
  );

  const setCalc = useCallback((c: Partial<CalcOptions>) => {
    setCalcState((prev) => ({ ...prev, ...c }));
  }, []);

  /* ------------------------------- location -------------------------------- */
  const setManualPlace = useCallback((p: Place) => {
    setPlace({ ...p, manual: true });
    setLocState('idle');
    setLocError('');
  }, []);

  const clearPlace = useCallback(() => {
    setPlace(null);
    local.remove('place');
    setLocState('idle');
  }, []);

  const detectLocation = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      setLocState('error');
      setLocError('This device does not expose a location sensor.');
      return;
    }
    setLocState('locating');
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await get<{ place: Place }>(
            `/geo/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          setPlace({ ...res.place, manual: false });
          setLocState('granted');
          toast('Location updated', 'success');
        } catch {
          setLocState('error');
          setLocError('Could not identify the city for these coordinates.');
        }
      },
      (err) => {
        setLocState(err.code === err.PERMISSION_DENIED ? 'denied' : 'error');
        setLocError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied'
            : 'Location unavailable'
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, [toast]);

  // Follow the user as they move: watch position and update when the city changes.
  useEffect(() => {
    if (!('geolocation' in navigator) || locState === 'denied') return;
    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const moved =
          !place ||
          Math.abs(place.lat - pos.coords.latitude) > 0.05 ||
          Math.abs(place.lon - pos.coords.longitude) > 0.05;
        if (!moved || place?.manual) return;
        try {
          const res = await get<{ place: Place }>(
            `/geo/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          if (res.place.city !== place?.city || res.place.timezone !== place?.timezone) {
            setPlace({ ...res.place, manual: false });
            toast(`Location updated: ${res.place.city}`, 'info');
          }
        } catch {
          /* keep the previous place */
        }
      },
      () => undefined,
      { maximumAge: 120000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locState, place?.city, place?.timezone]);

  /* ----------------------------- prayer times ------------------------------ */
  const times = useMemo(() => {
    if (!place) return null;
    try {
      return computeDay(now, place, calc);
    } catch {
      return null;
    }
  }, [place, calc, now.toDateString()]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = useMemo(() => (times ? computeNext(times, now) : null), [times, now]);
  const countdown = next ? formatCountdown(next.msLeft) : '--:--:--';
  const hijri = useMemo(() => hijriDate(now, lang), [now.toDateString(), lang]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------------------------- notifications ------------------------------ */
  const requestNotify = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      setNotifyPermission('unsupported');
      toast('This browser does not support notifications', 'error');
      return;
    }
    const result = await Notification.requestPermission();
    setNotifyPermission(result);
    if (result === 'granted') {
      setPrefs({ notifyEnabled: true });
      toast('Prayer reminders enabled', 'success');
    } else {
      toast('Notification permission was not granted', 'error');
    }
  }, [setPrefs, toast]);

  // In-app scheduling while the app is open. Android background delivery needs
  // the native shell described in docs/ANDROID_BUILD.md.
  useEffect(() => {
    if (!prefs.notifyEnabled || notifyPermission !== 'granted' || !times || !place) return;
    const id = setInterval(() => {
      const current = new Date();
      for (const key of FIVE) {
        if (prefs.prayerAlerts[key] === false) continue;
        const at = times[key];
        const diff = current.getTime() - at.getTime();
        const slot = `${at.toISOString()}:${key}`;
        if (diff >= 0 && diff < 60000 && !firedRef.current.has(slot)) {
          firedRef.current.add(slot);
          const body =
            key === 'fajr'
              ? `Fajr time in ${place.city}. Prayer is better than sleep.`
              : `It is time for ${key[0].toUpperCase()}${key.slice(1)} in ${place.city}.`;
          try {
            new Notification('RIFQ Muslim', { body, icon: '/icons/icon-192.png', tag: slot });
          } catch {
            /* notification constructor can fail on some platforms */
          }
          if (prefs.athanSound !== 'silent') {
            try {
              new Audio(
                `https://cdn.islamic.network/athan/${prefs.athanSound === 'madinah' ? 'madinah' : 'makkah'}.mp3`
              ).play().catch(() => undefined);
            } catch {
              /* autoplay blocked */
            }
          }
        }
      }
    }, 15000);
    return () => clearInterval(id);
  }, [prefs.notifyEnabled, prefs.prayerAlerts, prefs.athanSound, notifyPermission, times, place]);

  const value: Store = {
    lang,
    setLang,
    dir,
    t,
    theme,
    toggleTheme,
    place,
    locState,
    locError,
    detectLocation,
    setManualPlace,
    clearPlace,
    calc,
    setCalc,
    times,
    next,
    countdown,
    now,
    hijri,
    prefs,
    setPrefs,
    user,
    authReady,
    setUser,
    refreshUser,
    logout,
    toasts,
    toast,
    notifyPermission,
    requestNotify,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
