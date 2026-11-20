import React, { useEffect, useState } from 'react';
import { Page, Loading, ErrorBox } from '../components/Shell';
import { AppIcon } from '../components/Icons';
import { useStore } from '../lib/store';
import { get, post } from '../lib/api';

interface Collection {
  id: string;
  name: string;
  arabic: string;
  total: number;
  note?: string;
}

interface HadithItem {
  number: number;
  arabic: string;
  english: string;
  grades: { grade: string; scholar?: string }[];
}

export default function Hadith() {
  const { t, user, toast } = useStore();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [active, setActive] = useState<Collection | null>(null);
  const [items, setItems] = useState<HadithItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    get<{ collections: Collection[] }>('/hadith/collections')
      .then((res) => {
        setCollections(res.collections);
        setActive(res.collections[0] || null);
      })
      .catch(() => setError(t('The hadith collections could not be loaded. Check your connection.')));
  }, []);

  const load = (collection: Collection, nextPage: number) => {
    setLoading(true);
    setError('');
    get<{ items: HadithItem[]; total: number }>(`/hadith/${collection.id}?page=${nextPage}&size=10`)
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
        setPage(nextPage);
      })
      .catch(() => setError(t('These hadith could not be loaded right now.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (active) load(active, 1);
  }, [active?.id]);

  const search = async () => {
    if (!active || query.trim().length < 3) return toast(t('Type at least 3 characters'), 'error');
    setLoading(true);
    setError('');
    try {
      const res = await get<{ items: HadithItem[]; total: number }>(
        `/hadith/${active.id}/search?q=${encodeURIComponent(query.trim())}&size=10`
      );
      setItems(res.items);
      setTotal(res.total);
      setPage(1);
      if (!res.items.length) toast(t('No hadith matched that search'), 'info');
    } catch {
      setError(t('Search is unavailable right now.'));
    } finally {
      setLoading(false);
    }
  };

  const save = async (item: HadithItem) => {
    if (!active) return;
    if (!user) return toast(t('Sign in to save bookmarks'), 'error');
    try {
      await post('/bookmarks', {
        kind: 'hadith',
        ref: `hadith:${active.id}:${item.number}`,
        label: `${active.name} #${item.number}`,
      });
      toast(t('Bookmark saved'), 'success');
    } catch {
      toast(t('The bookmark could not be saved'), 'error');
    }
  };

  const pageCount = Math.max(1, Math.ceil(total / 10));

  return (
    <Page title="Hadith" subtitle={t('Six authentic collections with grading')}>
      <div className="chips scroll-x">
        {collections.map((c) => (
          <button key={c.id} className={`chip ${active?.id === c.id ? 'on' : ''}`} onClick={() => setActive(c)}>
            {c.name}
          </button>
        ))}
      </div>

      <div className="card row" style={{ gap: 8 }}>
        <input
          className="input"
          placeholder={t('Search this collection')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void search()}
        />
        <button className="btn btn-primary" onClick={() => void search()}>
          <AppIcon name="search" size={16} />
        </button>
      </div>

      {active && (
        <p className="tiny muted">
          {active.name} · {active.arabic} · {total || active.total} {t('hadith')}
        </p>
      )}

      {error && <ErrorBox message={error} onRetry={() => active && load(active, page)} />}
      {loading && <Loading />}

      <div className="stack" style={{ gap: 10 }}>
        {items.map((item) => (
          <article key={item.number} className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="badge-gold tiny">{active?.name} #{item.number}</span>
              {item.grades?.[0] && <span className="badge-soft tiny">{item.grades[0].grade}</span>}
            </div>
            <p className="arabic" dir="rtl" lang="ar" style={{ margin: '12px 0 8px' }}>{item.arabic}</p>
            <p className="small" style={{ margin: 0 }}>{item.english}</p>
            {item.grades?.length > 1 && (
              <p className="tiny muted" style={{ margin: '8px 0 0' }}>
                {t('Grading')}: {item.grades.map((g) => `${g.grade}${g.scholar ? ` (${g.scholar})` : ''}`).join(' · ')}
              </p>
            )}
            <div className="ayah-actions">
              <button className="icon-btn" aria-label={t('Bookmark')} onClick={() => void save(item)}>
                <AppIcon name="bookmark" size={17} />
              </button>
              <button
                className="icon-btn"
                aria-label={t('Share')}
                onClick={() => {
                  const text = `${item.arabic}\n\n${item.english}\n— ${active?.name} #${item.number}`;
                  if (navigator.share) void navigator.share({ title: active?.name, text });
                  else void navigator.clipboard.writeText(text).then(() => toast(t('Copied'), 'success'));
                }}
              >
                <AppIcon name="share" size={17} />
              </button>
            </div>
          </article>
        ))}
      </div>

      {items.length > 0 && (
        <div className="btn-row" style={{ marginTop: 12 }}>
          <button className="btn btn-soft" disabled={page <= 1} onClick={() => active && load(active, page - 1)}>
            {t('Previous')}
          </button>
          <span className="tiny muted" style={{ alignSelf: 'center' }}>{page} / {pageCount}</span>
          <button className="btn btn-soft" disabled={page >= pageCount} onClick={() => active && load(active, page + 1)}>
            {t('Next')}
          </button>
        </div>
      )}

      <p className="tiny muted center">
        {t('Texts are served from the open hadith dataset of the collections named above; grading follows the published source.')}
      </p>
    </Page>
  );
}
