import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../lib/store';
import { AppIcon } from '../components/Icons';
import { TopBar, Modal, Loading } from '../components/Shell';
import { get } from '../lib/api';
import { formatTime, FIVE, PRAYER_KEYS, type Place } from '../lib/prayer';
import { gregorianDate } from '../lib/hijri';
import { REMINDERS, dayIndex } from '../lib/data';

const VERSE_OF_DAY: { surah: number; ayah: number }[] = [
  { surah: 2, ayah: 286 },
  { surah: 94, ayah: 5 },
  { surah: 65, ayah: 3 },
  { surah: 13, ayah: 28 },
  { surah: 39, ayah: 53 },
  { surah: 2, ayah: 152 },
  { surah: 3, ayah: 139 },
  { surah: 55, ayah: 13 },
  { surah: 17, ayah: 80 },
  { surah: 40, ayah: 60 },
];

function greetingKey(hour: number) {
  if (hour < 5) return 'Peaceful night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 20) return 'Good evening';
  return 'Good evening';
}

export default function Home() {
  const { t, lang, place, locState, locError, detectLocation, setManualPlace, times, next, countdown, now, hijri, prefs, user, toast } = useStore();
  const [showLoc, setShowLoc] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [verse, setVerse] = useState<{ text: string; translation: string; surah: string; ayah: number } | null>(null);
  const [hadith, setHadith] = useState<{ arabic: string; english: string; name: string; number: number } | null>(null);
  const [tracker, setTracker] = useState<Record<string, boolean>>({});

  const idx = dayIndex(now, 100000);
  const reminder = REMINDERS[idx % REMINDERS.length];

  useEffect(() => {
    if (!place) void detectLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const pick = VERSE_OF_DAY[idx % VERSE_OF_DAY.length];
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async (attempt: number): Promise<void> => {
      try {
        const res = await get<{ ayahs: { number: number; text: string; translation: string }[]; englishName: string }>(
          `/quran/surah/${pick.surah}?translation=en.sahih`
        );
        const ayah = res.ayahs.find((a) => a.number === pick.ayah) || res.ayahs[0];
        if (!cancelled && ayah) {
          setVerse({ text: ayah.text, translation: ayah.translation, surah: res.englishName, ayah: ayah.number });
        }
      } catch {
        if (cancelled) return;
        if (attempt < 2) {
          timer = setTimeout(() => void load(attempt + 1), 3000);
          return;
        }
        setVerse(null);
      }
    };
    void load(0);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [idx]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async (attempt: number): Promise<void> => {
      try {
        const res = await get<{ items: { arabic: string; english: string; number: number }[]; name: string }>(
          '/hadith/bukhari?page=1&size=30'
        );
        const item = res.items[idx % Math.max(1, res.items.length)];
        if (!cancelled && item) setHadith({ ...item, name: res.name });
      } catch {
        if (cancelled) return;
        if (attempt < 2) {
          timer = setTimeout(() => void load(attempt + 1), 3000);
          return;
        }
        setHadith(null);
      }
    };
    void load(0);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [idx]);

  useEffect(() => {
    if (!user) return;
    get<{ entry: { data: string } | null }>('/tracker')
      .then((res) => {
        try {
          setTracker(res.entry ? JSON.parse(res.entry.data) : {});
        } catch {
          setTracker({});
        }
      })
      .catch(() => undefined);
  }, [user]);

  const searchCity = async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) return setResults([]);
    setSearching(true);
    try {
      const res = await get<{ results: Place[] }>(`/geo/search?q=${encodeURIComponent(q)}`);
      setResults(res.results);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const prayerDone = FIVE.filter((k) => tracker[`prayer:${k}`]).length;

  return (
    <>
      <TopBar />
      <div className="wrap">
        <section className="card" style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
          <div className="pattern" aria-hidden />
          <p className="tiny muted" style={{ margin: 0, letterSpacing: '.12em', textTransform: 'uppercase' }}>
            {t('Assalamu alaikum')}
          </p>
          <h1 className="page-title" style={{ margin: '4px 0 2px' }}>
            {t(greetingKey(now.getHours()))}
            {user ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="small muted" style={{ margin: 0 }}>
            {hijri ? `${hijri.day} ${hijri.monthName} ${hijri.year} AH` : t('Hijri date unavailable')} · {gregorianDate(now, lang)}
          </p>

          <div className="row" style={{ marginTop: 14, gap: 10, flexWrap: 'wrap' }}>
            <button className="chip" onClick={() => void detectLocation()} aria-label={t('Detect my location')}>
              <AppIcon name="location" size={15} />
              {locState === 'locating' ? t('Locating…') : place ? `${place.flag || ''} ${place.city}` : t('Location unavailable')}
            </button>
            <button className="chip" onClick={() => setShowLoc(true)}>
              <AppIcon name="search" size={15} /> {t('Choose city')}
            </button>
          </div>
          {place && (
            <p className="tiny muted" style={{ margin: '8px 0 0' }}>
              {[place.region, place.country].filter(Boolean).join(', ')} · {place.timezone} · {place.lat.toFixed(3)}, {place.lon.toFixed(3)}
              {place.manual ? ` · ${t('Selected manually')}` : ` · ${t('GPS detected')}`}
            </p>
          )}
          {!place && locError && <p className="tiny" style={{ margin: '8px 0 0', color: '#e0655b' }}>{t(locError)}</p>}
        </section>

        <section className="card" style={{ padding: 18 }}>
          {next ? (
            <>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <p className="tiny muted" style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '.1em' }}>
                    {t('Next prayer')}
                  </p>
                  <h2 className="section-title" style={{ margin: '2px 0 0', fontSize: 24 }}>
                    {t(next.key[0].toUpperCase() + next.key.slice(1))}
                    <span className="small muted" style={{ marginInlineStart: 8 }}>
                      {formatTime(next.at, place?.timezone || 'UTC', lang)}
                    </span>
                  </h2>
                </div>
                <div style={{ textAlign: 'end' }}>
                  <div className="countdown">{countdown}</div>
                  <p className="tiny muted" style={{ margin: 0 }}>
                    {next.tomorrow ? t('Tomorrow') : t('Today')}
                  </p>
                </div>
              </div>
              <div className="divider" />
            </>
          ) : (
            <p className="small muted" style={{ margin: 0 }}>
              {t('Choose a city to see prayer times.')}
            </p>
          )}

          {times && place ? (
            <div className="stack" style={{ gap: 4 }}>
              {PRAYER_KEYS.map((key) => {
                const isNext = next?.key === key;
                return (
                  <div
                    key={key}
                    className="prayer-row"
                    style={isNext ? { borderColor: 'var(--gold)', background: 'var(--gold-wash)' } : undefined}
                  >
                    <span className="row" style={{ gap: 8 }}>
                      <AppIcon name={key === 'sunrise' ? 'sun' : key === 'fajr' ? 'moon' : 'mosque'} size={16} />
                      {t(key[0].toUpperCase() + key.slice(1))}
                    </span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatTime(times[key], place.timezone, lang)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <button className="btn btn-primary btn-block" onClick={() => void detectLocation()}>
              <AppIcon name="location" size={17} /> {t('Enable location for accurate times')}
            </button>
          )}
          <Link to="/prayer" className="btn btn-soft btn-block" style={{ marginTop: 10 }}>
            {t('Calculation method and mosque comparison')} <AppIcon name="chevron" size={15} />
          </Link>
        </section>

        <section className="card">
          <h3 className="section-title">{t('Verse of the day')}</h3>
          {verse ? (
            <>
              <p className="arabic" dir="rtl" lang="ar">{verse.text}</p>
              <p className="small" style={{ marginTop: 8 }}>{verse.translation}</p>
              <p className="tiny muted" style={{ marginBottom: 0 }}>
                {verse.surah} · {t('Ayah')} {verse.ayah} — {t('Quran')}
              </p>
            </>
          ) : (
            <p className="small muted">{t('The verse could not be loaded. Check your connection.')}</p>
          )}
        </section>

        <section className="card">
          <h3 className="section-title">{t('Hadith of the day')}</h3>
          {hadith ? (
            <>
              <p className="arabic" dir="rtl" lang="ar">{hadith.arabic}</p>
              <p className="small" style={{ marginTop: 8 }}>{hadith.english}</p>
              <p className="tiny muted" style={{ marginBottom: 0 }}>
                {hadith.name} · {t('Hadith')} {hadith.number}
              </p>
            </>
          ) : (
            <p className="small muted">{t('Hadith could not be loaded right now.')}</p>
          )}
          <Link to="/hadith" className="btn btn-soft btn-sm" style={{ marginTop: 10 }}>
            {t('Browse collections')}
          </Link>
        </section>

        <section className="card">
          <h3 className="section-title">{t('Daily reminder')}</h3>
          <p className="small" style={{ marginBottom: 4 }}>{reminder.text}</p>
          <p className="tiny muted" style={{ marginBottom: 0 }}>{reminder.reference}</p>
        </section>

        <section className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3 className="section-title" style={{ margin: 0 }}>{t('Daily worship progress')}</h3>
            <span className="badge-gold">{prayerDone}/5</span>
          </div>
          <div className="row" style={{ gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
            {FIVE.map((k) => (
              <span key={k} className={`chip ${tracker[`prayer:${k}`] ? 'on' : ''}`} style={tracker[`prayer:${k}`] ? { borderColor: 'var(--gold)', color: 'var(--gold-deep)' } : undefined}>
                {tracker[`prayer:${k}`] ? '✓ ' : ''}
                {t(k[0].toUpperCase() + k.slice(1))}
              </span>
            ))}
          </div>
          <Link to="/tracker" className="btn btn-ghost btn-sm" style={{ marginTop: 10 }}>
            {t('Open tracker')} <AppIcon name="chevron" size={14} />
          </Link>
          {!user && <p className="tiny muted" style={{ marginBottom: 0 }}>{t('Sign in to save your progress across devices.')}</p>}
        </section>

        <h3 className="section-title">{t('Quick access')}</h3>
        <div className="grid grid-3">
          {[
            { to: '/quran', icon: 'quran' as const, label: 'Quran' },
            { to: '/qibla', icon: 'compass' as const, label: 'Qibla' },
            { to: '/duas', icon: 'heart' as const, label: 'Duas' },
            { to: '/hadith', icon: 'book' as const, label: 'Hadith' },
            { to: '/calendar', icon: 'calendar' as const, label: 'Calendar' },
            { to: '/tasbih', icon: 'beads' as const, label: 'Tasbih' },
            { to: '/zakat', icon: 'star' as const, label: 'Zakat' },
            { to: '/places', icon: 'mosque' as const, label: 'Mosques & Halal' },
            { to: '/assistant', icon: 'chat' as const, label: 'Assistant' },
          ].map((q) => (
            <Link key={q.to} to={q.to} className="tile">
              <span className="tile-icon"><AppIcon name={q.icon} size={20} /></span>
              <span className="small">{t(q.label)}</span>
            </Link>
          ))}
        </div>

        <p className="tiny muted center" style={{ marginTop: 22 }}>
          RIFQ Muslim · {t('Made by Eng Mohamud Yusuf')}
        </p>
      </div>

      <Modal open={showLoc} onClose={() => setShowLoc(false)} title={t('Choose your city')}>
        <p className="small muted" style={{ marginTop: 0 }}>
          {t('Search any city, town or village worldwide. Manually selected locations are labelled in the app.')}
        </p>
        <input
          className="input"
          placeholder={t('Search city, e.g. Mogadishu')}
          value={query}
          onChange={(e) => void searchCity(e.target.value)}
          autoFocus
        />
        <div className="stack" style={{ marginTop: 12, gap: 8, maxHeight: 320, overflowY: 'auto' }}>
          {searching && <Loading />}
          {!searching && results.length === 0 && query.length > 1 && (
            <p className="small muted">{t('No matching place found. Try a different spelling.')}</p>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.city}-${r.lat}-${i}`}
              className="prayer-row"
              style={{ width: '100%', textAlign: 'start' }}
              onClick={() => {
                setManualPlace(r);
                setShowLoc(false);
                toast(`${r.city} · ${r.timezone}`, 'success');
              }}
            >
              <span>{r.flag} {r.city}</span>
              <span className="tiny muted">{[r.region, r.country].filter(Boolean).join(', ')}</span>
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}
