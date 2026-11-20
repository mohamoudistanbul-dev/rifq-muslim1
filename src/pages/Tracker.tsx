import React, { useEffect, useMemo, useState } from 'react';
import { Page } from '../components/Shell';
import { AppIcon } from '../components/Icons';
import { useStore } from '../lib/store';
import { DAILY_CHALLENGES, GOOD_DEEDS, dayIndex } from '../lib/data';
import { FIVE, dayKey } from '../lib/prayer';
import { get, put } from '../lib/api';

interface DayData {
  prayers?: Record<string, boolean>;
  deeds?: string[];
  quranPages?: number;
  dhikr?: number;
  fasting?: boolean;
  goal?: string;
}

export default function Tracker() {
  const { t, user, place, toast } = useStore();
  const tz = place?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = dayKey(new Date(), tz);
  const [data, setData] = useState<DayData>({});
  const [recent, setRecent] = useState<{ day: string; data: DayData }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    get<{ entry: { data: DayData } | null; recent: { day: string; data: DayData }[] }>('/tracker')
      .then((res) => {
        setData(res.entry?.data || {});
        setRecent(res.recent || []);
      })
      .catch(() => undefined);
  }, [user]);

  const persist = async (next: DayData) => {
    setData(next);
    if (!user) return;
    setSaving(true);
    try {
      await put('/tracker', { day: today, data: next });
    } catch {
      toast(t('Your progress could not be saved'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const togglePrayer = (key: string) => {
    const prayers = { ...(data.prayers || {}), [key]: !data.prayers?.[key] };
    void persist({ ...data, prayers });
  };

  const toggleDeed = (id: string) => {
    const deeds = data.deeds || [];
    void persist({ ...data, deeds: deeds.includes(id) ? deeds.filter((d) => d !== id) : [...deeds, id] });
  };

  const challenge = DAILY_CHALLENGES[dayIndex(new Date(), DAILY_CHALLENGES.length)];
  const completed = FIVE.filter((p) => data.prayers?.[p]).length + (data.deeds?.length || 0);
  const possible = FIVE.length + GOOD_DEEDS.length;
  const pct = Math.round((completed / possible) * 100);

  const weekly = useMemo(() => {
    const map = new Map(recent.map((r) => [r.day, r.data]));
    const out: { day: string; prayers: number }[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dayKey(d, tz);
      const entry = map.get(key) || (key === today ? data : undefined);
      out.push({ day: d.toLocaleDateString(undefined, { weekday: 'short' }), prayers: FIVE.filter((p) => entry?.prayers?.[p]).length });
    }
    return out;
  }, [recent, data, tz, today]);

  return (
    <Page title="Worship Tracker" subtitle={t('Daily prayers, good deeds and goals')}>
      {!user && (
        <div className="notice">
          <p className="small" style={{ margin: 0 }}>
            {t('Sign in to store your tracker on the server. Without an account, changes are lost when you close the app.')}
          </p>
        </div>
      )}

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="small">{t('Today')}</span>
          <span className="badge-gold tiny">{pct}%</span>
        </div>
        <div className="divider" />
        <div className="stack" style={{ gap: 10 }}>
          {FIVE.map((p) => (
            <div key={p} className="row" style={{ justifyContent: 'space-between' }}>
              <span className="small" style={{ textTransform: 'capitalize' }}>{t(p)}</span>
              <label className="switch">
                <input type="checkbox" checked={Boolean(data.prayers?.[p])} onChange={() => togglePrayer(p)} />
                <span />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">{t('Good deeds')}</h3>
        <div className="stack" style={{ gap: 10 }}>
          {GOOD_DEEDS.map((d) => (
            <div key={d.id} className="row" style={{ justifyContent: 'space-between' }}>
              <span className="small">{t(d.label)}</span>
              <label className="switch">
                <input type="checkbox" checked={(data.deeds || []).includes(d.id)} onChange={() => toggleDeed(d.id)} />
                <span />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">{t('Quran and dhikr')}</h3>
        <div className="field">
          <label>{t('Pages read today')}</label>
          <input
            className="input"
            inputMode="numeric"
            value={data.quranPages ?? ''}
            onChange={(e) => void persist({ ...data, quranPages: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="field">
          <label>{t('Dhikr counted')}</label>
          <input
            className="input"
            inputMode="numeric"
            value={data.dhikr ?? ''}
            onChange={(e) => void persist({ ...data, dhikr: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="field">
          <label>{t('Personal goal for today')}</label>
          <input
            className="input"
            value={data.goal ?? ''}
            placeholder={t('e.g. finish Surah al-Kahf')}
            onChange={(e) => setData({ ...data, goal: e.target.value })}
            onBlur={() => void persist(data)}
          />
        </div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="small">{t('Fasting today')}</span>
          <label className="switch">
            <input type="checkbox" checked={Boolean(data.fasting)} onChange={() => void persist({ ...data, fasting: !data.fasting })} />
            <span />
          </label>
        </div>
        {saving && <p className="tiny muted">{t('Saving…')}</p>}
      </div>

      <div className="card">
        <h3 className="section-title">{t('Last 7 days')}</h3>
        <div className="row" style={{ alignItems: 'flex-end', gap: 8, height: 90 }}>
          {weekly.map((w) => (
            <div key={w.day} style={{ flex: 1, textAlign: 'center' }}>
              <div
                style={{
                  height: `${(w.prayers / 5) * 60 + 4}px`,
                  borderRadius: 6,
                  background: w.prayers === 5 ? 'var(--gold)' : 'var(--emerald-soft)',
                }}
              />
              <span className="tiny muted">{w.day}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">{t('Today’s challenge')}</h3>
        <p className="small" style={{ marginTop: 0 }}>{t(challenge)}</p>
        <div className="row" style={{ gap: 8 }}>
          <AppIcon name="star" size={16} />
          <span className="tiny muted">{t('A small daily step, rewarded by Allah alone.')}</span>
        </div>
      </div>
    </Page>
  );
}
