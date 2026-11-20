import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Page } from '../components/Shell';
import { AppIcon } from '../components/Icons';
import { useStore } from '../lib/store';
import { ARABIC_LETTERS, MANNERS, PROPHETS, SHORT_SURAHS } from '../lib/data';
import { local } from '../lib/api';

type Tab = 'letters' | 'surahs' | 'manners' | 'prophets' | 'progress';

interface KidsProgress {
  letters: string[];
  surahs: number[];
  manners: string[];
  stars: number;
}

const EMPTY: KidsProgress = { letters: [], surahs: [], manners: [], stars: 0 };

export default function Kids() {
  const { t, toast } = useStore();
  const [tab, setTab] = useState<Tab>('letters');
  const [progress, setProgress] = useState<KidsProgress>(() => local.get<KidsProgress>('kidsProgress', EMPTY));
  const [parentUnlocked, setParentUnlocked] = useState(false);
  const [answer, setAnswer] = useState('');
  const [gate] = useState(() => ({ a: 3 + Math.floor(Math.random() * 5), b: 4 + Math.floor(Math.random() * 5) }));

  const save = (next: KidsProgress) => {
    setProgress(next);
    local.set('kidsProgress', next);
  };

  const toggleLetter = (letter: string) => {
    const has = progress.letters.includes(letter);
    const next = {
      ...progress,
      letters: has ? progress.letters.filter((l) => l !== letter) : [...progress.letters, letter],
      stars: has ? Math.max(0, progress.stars - 1) : progress.stars + 1,
    };
    save(next);
  };

  const toggleSurah = (num: number) => {
    const has = progress.surahs.includes(num);
    const next = {
      ...progress,
      surahs: has ? progress.surahs.filter((s) => s !== num) : [...progress.surahs, num],
      stars: has ? Math.max(0, progress.stars - 1) : progress.stars + 1,
    };
    save(next);
  };

  const toggleManner = (title: string) => {
    const has = progress.manners.includes(title);
    save({ ...progress, manners: has ? progress.manners.filter((m) => m !== title) : [...progress.manners, title] });
  };

  const unlockParent = () => {
    if (Number(answer) === gate.a + gate.b) {
      setParentUnlocked(true);
      toast(t('Parent settings unlocked'), 'success');
    } else {
      toast(t('That answer is not correct'), 'error');
    }
    setAnswer('');
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'letters', label: 'Arabic alphabet' },
    { id: 'surahs', label: 'Short surahs' },
    { id: 'manners', label: 'Manners' },
    { id: 'prophets', label: 'Prophets' },
    { id: 'progress', label: 'My progress' },
  ];

  return (
    <Page title="Kids Academy" subtitle={t('Gentle Islamic learning for children')}>
      <div className="chips scroll-x">
        {TABS.map((tb) => (
          <button key={tb.id} className={`chip ${tab === tb.id ? 'on' : ''}`} onClick={() => setTab(tb.id)}>
            {t(tb.label)}
          </button>
        ))}
      </div>

      {tab === 'letters' && (
        <>
          <p className="tiny muted">{t('Tap a letter to mark it as learned.')}</p>
          <div className="grid grid-4" style={{ gap: 8 }}>
            {ARABIC_LETTERS.map((l) => {
              const done = progress.letters.includes(l.letter);
              return (
                <button
                  key={l.letter}
                  className="card center"
                  onClick={() => toggleLetter(l.letter)}
                  style={{ padding: 10, borderColor: done ? 'var(--gold)' : undefined, background: done ? 'rgba(212,175,55,0.12)' : undefined }}
                >
                  <span className="arabic" style={{ fontSize: 28, display: 'block' }}>{l.letter}</span>
                  <span className="tiny muted">{l.name}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {tab === 'surahs' && (
        <div className="stack" style={{ gap: 8 }}>
          {SHORT_SURAHS.map((s) => (
            <div key={s.number} className="card row" style={{ justifyContent: 'space-between' }}>
              <Link to={`/quran/${s.number}`} style={{ textDecoration: 'none', flex: 1 }}>
                <span style={{ display: 'block' }}>{s.name}</span>
                <span className="tiny muted">{s.verses} {t('ayahs')}</span>
              </Link>
              <button
                className={`btn btn-sm ${progress.surahs.includes(s.number) ? 'btn-primary' : 'btn-soft'}`}
                onClick={() => toggleSurah(s.number)}
              >
                {progress.surahs.includes(s.number) ? t('Learned') : t('Mark learned')}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'manners' && (
        <div className="stack" style={{ gap: 8 }}>
          {MANNERS.map((m) => (
            <div key={m.title} className="card">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h3 className="section-title" style={{ margin: 0 }}>{m.title}</h3>
                <label className="switch">
                  <input type="checkbox" checked={progress.manners.includes(m.title)} onChange={() => toggleManner(m.title)} />
                  <span />
                </label>
              </div>
              <p className="small" style={{ margin: '6px 0 0' }}>{m.detail}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'prophets' && (
        <div className="stack" style={{ gap: 8 }}>
          {PROPHETS.map((p) => (
            <div key={p.name} className="card">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h3 className="section-title" style={{ margin: 0 }}>{p.name}</h3>
                <span className="arabic" style={{ fontSize: 22 }}>{p.arabic}</span>
              </div>
              <p className="small" style={{ margin: '6px 0 0' }}>{p.note}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'progress' && (
        <>
          <div className="card center">
            <p className="countdown" style={{ margin: 0 }}>{progress.stars}</p>
            <p className="tiny muted">{t('Stars earned')}</p>
            <div className="grid grid-3">
              <div className="stat">
                <strong>{progress.letters.length}/28</strong>
                <span className="tiny muted">{t('Letters')}</span>
              </div>
              <div className="stat">
                <strong>{progress.surahs.length}/{SHORT_SURAHS.length}</strong>
                <span className="tiny muted">{t('Surahs')}</span>
              </div>
              <div className="stat">
                <strong>{progress.manners.length}/{MANNERS.length}</strong>
                <span className="tiny muted">{t('Manners')}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="section-title">{t('Parent controls')}</h3>
            {parentUnlocked ? (
              <>
                <p className="small" style={{ marginTop: 0 }}>
                  {t('This area holds no personal data and no ads. Progress stays on this device only.')}
                </p>
                <button className="btn btn-soft btn-block" onClick={() => { save(EMPTY); toast(t('Progress reset'), 'success'); }}>
                  {t('Reset child progress')}
                </button>
                <p className="tiny muted" style={{ marginBottom: 0 }}>
                  {t('Child accounts are not created; nothing from this area is shared with the community.')}
                </p>
              </>
            ) : (
              <>
                <p className="small" style={{ marginTop: 0 }}>
                  {t('To open parent controls, solve this: what is')} {gate.a} + {gate.b}?
                </p>
                <div className="row" style={{ gap: 8 }}>
                  <input className="input" inputMode="numeric" value={answer} onChange={(e) => setAnswer(e.target.value)} />
                  <button className="btn btn-primary" onClick={unlockParent}>{t('Unlock')}</button>
                </div>
              </>
            )}
          </div>

          <Link to="/quiz" className="btn btn-emerald btn-block">
            <AppIcon name="star" size={16} /> {t('Try an Islamic quiz')}
          </Link>
        </>
      )}
    </Page>
  );
}
