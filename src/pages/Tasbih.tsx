import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { Page } from '../components/Shell';
import { AppIcon } from '../components/Icons';
import { get, post } from '../lib/api';

const PRESETS = [
  { dhikr: 'SubhanAllah', arabic: 'سُبْحَانَ اللَّهِ', target: 33 },
  { dhikr: 'Alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', target: 33 },
  { dhikr: 'Allahu Akbar', arabic: 'اللَّهُ أَكْبَرُ', target: 34 },
  { dhikr: 'La ilaha illa Allah', arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ', target: 100 },
  { dhikr: 'Astaghfirullah', arabic: 'أَسْتَغْفِرُ اللَّهَ', target: 100 },
  { dhikr: 'Salawat', arabic: 'صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ', target: 100 },
];

interface Entry {
  id: string;
  dhikr: string;
  count: number;
  target: number;
  day: string;
}

export default function Tasbih() {
  const { t, user, toast } = useStore();
  const [dhikr, setDhikr] = useState(PRESETS[0].dhikr);
  const [target, setTarget] = useState(33);
  const [count, setCount] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [totals, setTotals] = useState<{ day: string; total: number }[]>([]);
  const [custom, setCustom] = useState('');

  const arabic = useMemo(() => PRESETS.find((p) => p.dhikr === dhikr)?.arabic || dhikr, [dhikr]);

  useEffect(() => {
    if (!user) return;
    get<{ entries: Entry[]; totals: { day: string; total: number }[] }>('/tasbih')
      .then((res) => {
        const mine = res.entries.find((e) => e.dhikr === dhikr);
        if (mine) {
          setCount(mine.count);
          setTarget(mine.target);
        }
        setTotals(res.totals);
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, dhikr]);

  const save = async (nextCount: number) => {
    if (!user) return;
    try {
      await post('/tasbih', { dhikr, count: nextCount, target });
    } catch {
      /* offline: local state still holds the count */
    }
  };

  const tap = () => {
    const nextCount = count + 1;
    setCount(nextCount);
    setHistory((h) => [...h.slice(-49), nextCount]);
    if (navigator.vibrate) navigator.vibrate(12);
    if (nextCount === target) {
      toast(`${target} × ${dhikr} — ${t('completed')}`, 'success');
      if (navigator.vibrate) navigator.vibrate([30, 40, 30]);
    }
    void save(nextCount);
  };

  const undo = () => {
    const nextCount = Math.max(0, count - 1);
    setCount(nextCount);
    setHistory((h) => [...h, nextCount]);
    void save(nextCount);
  };

  const reset = () => {
    setCount(0);
    setHistory([]);
    void save(0);
  };

  const progress = Math.min(100, Math.round((count / Math.max(1, target)) * 100));

  return (
    <Page title="Tasbih" subtitle={t('Count your dhikr with haptic feedback')}>
      <div className="card center stack">
        <div className="chips" style={{ justifyContent: 'center' }}>
          {PRESETS.map((p) => (
            <button
              key={p.dhikr}
              className={`chip ${dhikr === p.dhikr ? 'on' : ''}`}
              onClick={() => {
                setDhikr(p.dhikr);
                setTarget(p.target);
                setCount(0);
              }}
            >
              {p.dhikr}
            </button>
          ))}
        </div>

        <p className="arabic-lg" dir="rtl" lang="ar" style={{ margin: '10px 0 0' }}>{arabic}</p>
        <p className="small muted" style={{ margin: 0 }}>{dhikr}</p>

        <button className="tasbih-tap" onClick={tap} aria-label={`${t('Count')} ${dhikr}`}>
          <span className="tasbih-count">{count}</span>
          <span className="tiny muted">{t('Tap to count')}</span>
        </button>

        <div style={{ width: '100%', height: 8, borderRadius: 99, background: 'var(--line)', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--gold), var(--emerald-bright))', transition: 'width .2s' }} />
        </div>
        <p className="tiny muted" style={{ margin: 0 }}>
          {t('Target')}: {target} · {progress}%
        </p>

        <div className="btn-row" style={{ justifyContent: 'center' }}>
          <button className="btn btn-soft btn-sm" onClick={undo} disabled={count === 0}>
            {t('Undo')}
          </button>
          <button className="btn btn-soft btn-sm" onClick={reset}>
            {t('Reset')}
          </button>
          <button className="btn btn-emerald btn-sm" onClick={() => setCount((c) => c + 10)}>
            +10
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">{t('Target and custom dhikr')}</h3>
        <div className="row" style={{ gap: 10 }}>
          <input
            className="input"
            type="number"
            min={1}
            max={100000}
            value={target}
            onChange={(e) => setTarget(Math.max(1, Number(e.target.value) || 1))}
            aria-label={t('Target')}
          />
          <button className="btn btn-soft" onClick={() => void save(count)}>{t('Save')}</button>
        </div>
        <div className="row" style={{ gap: 10, marginTop: 10 }}>
          <input
            className="input"
            placeholder={t('Custom dhikr, e.g. Ya Latif')}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
          <button
            className="btn btn-primary"
            onClick={() => {
              const value = custom.trim();
              if (value.length < 2) return;
              setDhikr(value);
              setCount(0);
              setCustom('');
            }}
          >
            {t('Use')}
          </button>
        </div>
        {!user && <p className="tiny muted" style={{ marginBottom: 0 }}>{t('Sign in to keep your daily totals on every device.')}</p>}
      </div>

      {totals.length > 0 && (
        <div className="card">
          <h3 className="section-title">{t('Recent daily totals')}</h3>
          <table className="table">
            <tbody>
              {totals.slice(0, 10).map((row) => (
                <tr key={row.day}>
                  <td>{row.day}</td>
                  <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="tiny muted center">
        <AppIcon name="beads" size={14} /> {t('Progress is stored on your account when you are signed in, and locally otherwise.')}
      </p>
    </Page>
  );
}
