import React, { useMemo, useState } from 'react';
import { Page } from '../components/Shell';
import { AppIcon } from '../components/Icons';
import { useStore } from '../lib/store';
import { DUAS, DUA_CATEGORIES } from '../lib/data';
import { post } from '../lib/api';

export default function Duas() {
  const { t, user, toast } = useStore();
  const [category, setCategory] = useState<string>('all');
  const [query, setQuery] = useState('');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DUAS.filter((d) => {
      const inCat = category === 'all' || d.category === category;
      const inQuery =
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.transliteration.toLowerCase().includes(q) ||
        d.translation.toLowerCase().includes(q) ||
        d.arabic.includes(query.trim());
      return inCat && inQuery;
    });
  }, [category, query]);

  const save = async (duaId: string, title: string) => {
    if (!user) return toast(t('Sign in to save bookmarks'), 'error');
    try {
      await post('/bookmarks', { kind: 'dua', ref: `dua:${duaId}`, label: title });
      toast(t('Bookmark saved'), 'success');
    } catch {
      toast(t('The bookmark could not be saved'), 'error');
    }
  };

  return (
    <Page title="Duas" subtitle={t('Adhkar for morning, evening and daily life')}>
      <div className="card">
        <input className="input" placeholder={t('Search duas')} value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="chips" style={{ marginTop: 10 }}>
          <button className={`chip ${category === 'all' ? 'on' : ''}`} onClick={() => setCategory('all')}>
            {t('All')}
          </button>
          {DUA_CATEGORIES.map((c) => (
            <button key={c.id} className={`chip ${category === c.id ? 'on' : ''}`} onClick={() => setCategory(c.id)}>
              {t(c.label)}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 && (
        <div className="empty">
          <p className="small">{t('No dua matches that search.')}</p>
        </div>
      )}

      <div className="stack" style={{ gap: 10 }}>
        {list.map((dua) => (
          <article key={dua.id} className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3 className="section-title" style={{ margin: 0 }}>{t(dua.title)}</h3>
              <span className="badge-soft tiny">{t(DUA_CATEGORIES.find((c) => c.id === dua.category)?.label || '')}</span>
            </div>
            <p className="arabic" dir="rtl" lang="ar" style={{ margin: '12px 0 8px' }}>{dua.arabic}</p>
            <p className="tiny muted" style={{ margin: 0, fontStyle: 'italic' }}>{dua.transliteration}</p>
            <p className="small" style={{ margin: '8px 0 0' }}>{dua.translation}</p>
            <p className="tiny muted" style={{ margin: '8px 0 0' }}>{dua.reference}</p>
            <div className="ayah-actions">
              <button className="icon-btn" aria-label={t('Bookmark')} onClick={() => void save(dua.id, dua.title)}>
                <AppIcon name="bookmark" size={17} />
              </button>
              <button
                className="icon-btn"
                aria-label={t('Share')}
                onClick={() => {
                  const text = `${dua.arabic}\n\n${dua.translation}\n${dua.reference}`;
                  if (navigator.share) void navigator.share({ title: dua.title, text });
                  else void navigator.clipboard.writeText(text).then(() => toast(t('Copied'), 'success'));
                }}
              >
                <AppIcon name="share" size={17} />
              </button>
            </div>
          </article>
        ))}
      </div>

      <p className="tiny muted center">
        {t('Every dua carries the reference it is reported in. Audio for these adhkar is not bundled because we only publish recordings with clear licensing.')}
      </p>
    </Page>
  );
}
