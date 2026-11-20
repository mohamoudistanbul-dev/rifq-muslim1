import React, { useEffect, useMemo, useState } from 'react';
import { Page } from '../components/Shell';
import { AppIcon } from '../components/Icons';
import { useStore } from '../lib/store';
import { HIJRI_MONTHS, OCCASIONS, gregorianDate, hijriMonthLength, upcomingOccasions } from '../lib/hijri';
import { formatTime, dayKey } from '../lib/prayer';
import { get, put } from '../lib/api';

interface DayEntry {
  fasting?: boolean;
  taraweeh?: boolean;
  quranPages?: number;
}

export default function Calendar() {
  const { t, lang, hijri, place, times, toast, user } = useStore();
  const [monthOffset, setMonthOffset] = useState(0);
  const [fasting, setFasting] = useState<Record<string, DayEntry>>({});
  const [busy, setBusy] = useState(false);

  const today = new Date();
  const tz = place?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    if (!user) return;
    get<{ recent: { day: string; data: DayEntry }[] }>('/tracker')
      .then((res) => {
        const map: Record<string, DayEntry> = {};
        res.recent.forEach((r) => {
          map[r.day] = r.data || {};
        });
        setFasting(map);
      })
      .catch(() => undefined);
  }, [user]);

  const monthDays = useMemo(() => {
    const base = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const days: { date: Date; hijriDay: number | null; label: string }[] = [];
    const count = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= count; d += 1) {
      const date = new Date(base.getFullYear(), base.getMonth(), d);
      const h = hijriFor(date, lang);
      days.push({ date, hijriDay: h?.day ?? null, label: String(d) });
    }
    return days;
  }, [monthOffset, lang]);

  function hijriFor(date: Date, l: string) {
    // Local helper so the grid can label each Gregorian day with its Hijri day.
    try {
      const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric' });
      const parts = fmt.formatToParts(date);
      const day = Number(parts.find((p) => p.type === 'day')?.value);
      return { day: Number.isFinite(day) ? day : null, l };
    } catch {
      return null;
    }
  }

  const toggleFasting = async () => {
    if (!user) return toast(t('Sign in to keep your fasting record'), 'error');
    const key = dayKey(new Date(), tz);
    const next = { ...(fasting[key] || {}), fasting: !(fasting[key]?.fasting) };
    setBusy(true);
    try {
      await put('/tracker', { day: key, data: next });
      setFasting((f) => ({ ...f, [key]: next }));
      toast(next.fasting ? t('Fasting recorded') : t('Fasting mark removed'), 'success');
    } catch {
      toast(t('The record could not be saved'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const ramadan = hijri?.month === 9;
  const occasions = upcomingOccasions(hijri, 5);

  return (
    <Page title="Calendar" subtitle={t('Hijri and Gregorian dates, Ramadan and occasions')}>
      <div className="card">
        <p className="tiny muted" style={{ marginTop: 0 }}>{gregorianDate(today, lang)}</p>
        <p className="section-title" style={{ margin: '4px 0' }}>
          {hijri ? `${hijri.day} ${HIJRI_MONTHS[lang === 'ar' ? 'ar' : 'en'][hijri.month - 1]} ${hijri.year} AH` : t('Hijri date unavailable')}
        </p>
        <p className="tiny muted" style={{ margin: 0 }}>
          {t('Calculated with the Umm al-Qura calendar. Local moon sighting can differ by one day.')}
        </p>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <button className="icon-btn" onClick={() => setMonthOffset((m) => m - 1)} aria-label={t('Previous')}>
            <AppIcon name="back" size={16} />
          </button>
          <p className="small" style={{ margin: 0 }}>
            {today.toLocaleDateString(lang === 'ar' ? 'ar' : 'en', { month: 'long', year: 'numeric' })}
          </p>
          <button className="icon-btn" onClick={() => setMonthOffset((m) => m + 1)} aria-label={t('Next')}>
            <AppIcon name="chevron" size={16} />
          </button>
        </div>
        <div className="grid grid-4" style={{ marginTop: 12, gap: 6 }}>
          {monthDays.map((d) => {
            const isToday = d.date.toDateString() === today.toDateString();
            return (
              <div
                key={d.label}
                className="stat"
                style={{
                  padding: '8px 6px',
                  textAlign: 'center',
                  borderColor: isToday ? 'var(--gold)' : undefined,
                  background: isToday ? 'rgba(212,175,55,0.14)' : undefined,
                }}
              >
                <span className="small" style={{ display: 'block' }}>{d.label}</span>
                <span className="tiny muted">{d.hijriDay ?? '—'}</span>
              </div>
            );
          })}
        </div>
      </div>

      {ramadan && (
        <div className="card">
          <h3 className="section-title">{t('Ramadan')}</h3>
          <div className="grid grid-2">
            <div className="stat">
              <span className="tiny muted">{t('Suhoor ends (Fajr)')}</span>
              <strong>{times ? formatTime(times.fajr, tz, lang) : '—'}</strong>
            </div>
            <div className="stat">
              <span className="tiny muted">{t('Iftar (Maghrib)')}</span>
              <strong>{times ? formatTime(times.maghrib, tz, lang) : '—'}</strong>
            </div>
          </div>
          <button className="btn btn-primary btn-block" style={{ marginTop: 10 }} onClick={() => void toggleFasting()} disabled={busy}>
            <AppIcon name="moon" size={16} />
            {fasting[dayKey(today, tz)]?.fasting ? t('Fasting recorded — tap to undo') : t('Mark today as fasting')}
          </button>
          <p className="tiny muted" style={{ marginBottom: 0 }}>
            {t('Suhoor and iftar use the same calculation engine as your prayer times.')}
          </p>
        </div>
      )}

      <div className="card">
        <h3 className="section-title">{t('Islamic occasions')}</h3>
        <div className="stack" style={{ gap: 8 }}>
          {occasions.map((o) => (
            <div key={`${o.month}-${o.day}`} className="row" style={{ justifyContent: 'space-between' }}>
              <span className="small">{t(o.title)}</span>
              <span className="tiny muted">
                {o.day}/{o.month}{o.note ? ` · ${t(o.note)}` : ''}
              </span>
            </div>
          ))}
          {occasions.length === 0 && <p className="tiny muted">{t('No occasion in the coming days.')}</p>}
        </div>
        <div className="divider" />
        <p className="tiny muted" style={{ margin: 0 }}>
          {t('Eid dates depend on local moon sighting. Confirm with your mosque before making plans.')}
        </p>
      </div>

      <div className="card">
        <h3 className="section-title">{t('Hijri month lengths')}</h3>
        <p className="small" style={{ marginTop: 0 }}>
          {t('This month has')} {hijriMonthLength(today)} {t('days in the calculated calendar')}.
        </p>
        <p className="tiny muted" style={{ marginBottom: 0 }}>
          {t('Occasions tracked')}: {OCCASIONS.map((o) => t(o.title)).join(' · ')}
        </p>
      </div>
    </Page>
  );
}
