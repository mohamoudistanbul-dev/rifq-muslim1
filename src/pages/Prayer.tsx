import React, { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { Page } from '../components/Shell';
import { AppIcon } from '../components/Icons';
import {
  METHODS,
  HIGH_LAT,
  PRAYER_KEYS,
  FIVE,
  formatTime,
  type MethodId,
  type HighLat,
  type PrayerKey,
} from '../lib/prayer';

const REGION_DEFAULT: Record<string, MethodId> = {
  SO: 'MWL',
  SA: 'UmmAlQura',
  AE: 'Dubai',
  EG: 'Egyptian',
  PK: 'Karachi',
  IN: 'Karachi',
  BD: 'Karachi',
  TR: 'Diyanet',
  KW: 'Kuwait',
  QA: 'Qatar',
  SG: 'Singapore',
  MY: 'Singapore',
  ID: 'Singapore',
  US: 'ISNA',
  CA: 'ISNA',
  GB: 'MoonsightingCommittee',
};

export default function Prayer() {
  const { t, lang, place, times, next, countdown, calc, setCalc, now, toast } = useStore();
  const [mosque, setMosque] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('rifq.mosque') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('rifq.mosque', JSON.stringify(mosque));
  }, [mosque]);

  const suggested = place ? REGION_DEFAULT[place.countryCode] : undefined;

  const diffMinutes = (key: PrayerKey): number | null => {
    const value = mosque[key];
    if (!value || !times || !place) return null;
    const [h, m] = value.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: place.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const [ch, cm] = fmt.format(times[key]).split(':').map(Number);
    return h * 60 + m - (ch * 60 + cm);
  };

  return (
    <Page title="Prayer" subtitle={place ? `${place.city} · ${place.timezone}` : t('Location unavailable')}>
      {!place && (
        <div className="card">
          <p className="small" style={{ margin: 0 }}>
            {t('Location unavailable')} — {t('Choose a city on the Home screen to calculate prayer times.')}
          </p>
        </div>
      )}

      {times && place && (
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3 className="section-title" style={{ margin: 0 }}>{t('Today')}</h3>
            {next && (
              <span className="badge-gold">
                {t(next.key[0].toUpperCase() + next.key.slice(1))} · {countdown}
              </span>
            )}
          </div>
          <div className="stack" style={{ gap: 4, marginTop: 10 }}>
            {PRAYER_KEYS.map((key) => (
              <div key={key} className={`prayer-row ${next?.key === key ? 'active' : ''}`} style={next?.key === key ? { borderColor: 'var(--gold)' } : undefined}>
                <span>{t(key[0].toUpperCase() + key.slice(1))}</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatTime(times[key], place.timezone, lang)}</span>
              </div>
            ))}
          </div>
          <p className="tiny muted" style={{ marginBottom: 0 }}>
            {t('Calculated astronomically for your exact coordinates and timezone. Sunrise is listed separately and is not a prayer.')}
          </p>
        </div>
      )}

      <div className="card">
        <h3 className="section-title">{t('Calculation method')}</h3>
        {suggested && (
          <p className="tiny muted" style={{ marginTop: 0 }}>
            {t('Suggested for your region')}: {METHODS.find((m) => m.id === suggested)?.label}
          </p>
        )}
        <select className="select" value={calc.method} onChange={(e) => setCalc({ method: e.target.value as MethodId })}>
          {METHODS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
              {m.note ? ` — ${m.note}` : ''}
            </option>
          ))}
        </select>

        <div className="field" style={{ marginTop: 14 }}>
          <label>{t('Asr calculation')}</label>
          <div className="btn-row">
            {(['shafi', 'hanafi'] as const).map((m) => (
              <button
                key={m}
                className={`btn ${calc.madhab === m ? 'btn-emerald' : 'btn-soft'}`}
                onClick={() => setCalc({ madhab: m })}
              >
                {m === 'shafi' ? t('Standard') : t('Hanafi')}
              </button>
            ))}
          </div>
        </div>

        <div className="field" style={{ marginTop: 14 }}>
          <label>{t('High latitude adjustment')}</label>
          <select
            className="select"
            value={calc.highLatitude}
            onChange={(e) => setCalc({ highLatitude: e.target.value as HighLat })}
          >
            {HIGH_LAT.map((h) => (
              <option key={h.id} value={h.id}>
                {h.label}
              </option>
            ))}
          </select>
          <p className="tiny muted" style={{ marginBottom: 0 }}>
            {t('Used for cities where the sun does not set low enough for true twilight, such as northern Europe.')}
          </p>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">{t('Compare with your mosque')}</h3>
        <p className="tiny muted" style={{ marginTop: 0 }}>
          {t('Enter your mosque timetable to see the difference. RIFQ never changes the calculated times to match it.')}
        </p>
        <div className="stack" style={{ gap: 8 }}>
          {FIVE.map((key) => {
            const d = diffMinutes(key);
            return (
              <div key={key} className="row" style={{ gap: 10, justifyContent: 'space-between' }}>
                <span className="small" style={{ flex: 1 }}>{t(key[0].toUpperCase() + key.slice(1))}</span>
                <input
                  className="input"
                  type="time"
                  style={{ width: 130 }}
                  value={mosque[key] || ''}
                  onChange={(e) => setMosque({ ...mosque, [key]: e.target.value })}
                  aria-label={`${t('Mosque time')} ${key}`}
                />
                <span className="tiny" style={{ width: 74, textAlign: 'end', color: d === null ? 'var(--text-muted)' : Math.abs(d) > 5 ? 'var(--gold-deep)' : 'var(--emerald)' }}>
                  {d === null ? '—' : `${d > 0 ? '+' : ''}${d} ${t('min')}`}
                </span>
              </div>
            );
          })}
        </div>
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => setMosque({})}>
          {t('Clear mosque times')}
        </button>
      </div>

      <div className="card">
        <h3 className="section-title">{t('Prayer reminders')}</h3>
        <p className="small" style={{ marginTop: 0 }}>
          {t('Manage Athan sound, per-prayer alerts and pre-prayer reminders.')}
        </p>
        <a className="btn btn-primary btn-block" href="#/athan">
          <AppIcon name="bell" size={17} /> {t('Athan and notifications')}
        </a>
        <p className="tiny muted" style={{ marginBottom: 0 }}>
          {t('Times recalculate automatically when your location, the date or the calculation method changes.')} {now.toLocaleTimeString(lang)}
        </p>
      </div>

      <p className="tiny muted center">
        {t('Results are astronomical estimates. Follow your local mosque for congregation times.')}
      </p>
    </Page>
  );
}
