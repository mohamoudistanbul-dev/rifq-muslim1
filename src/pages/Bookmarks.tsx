import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Page, Loading, ErrorBox } from '../components/Shell';
import { AppIcon } from '../components/Icons';
import { useStore } from '../lib/store';
import { get, del } from '../lib/api';

interface Bookmark {
  id: number;
  kind: string;
  ref: string;
  label: string;
  surah?: number;
  ayah?: number;
  createdAt: string;
}

export default function Bookmarks() {
  const { t, user, toast, authReady } = useStore();
  const [items, setItems] = useState<Bookmark[] | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    get<{ bookmarks: Bookmark[] }>('/bookmarks')
      .then((res) => setItems(res.bookmarks))
      .catch(() => setError(t('Your bookmarks could not be loaded.')));
  };

  useEffect(() => {
    if (authReady && user) load();
  }, [authReady, user]);

  const remove = async (id: number) => {
    try {
      await del(`/bookmarks/${id}`);
      setItems((list) => (list || []).filter((b) => b.id !== id));
      toast(t('Bookmark removed'), 'success');
    } catch {
      toast(t('The bookmark could not be removed'), 'error');
    }
  };

  const link = (b: Bookmark) => {
    if (b.kind === 'quran' && b.surah) return `/quran/${b.surah}${b.ayah ? `?ayah=${b.ayah}` : ''}`;
    if (b.kind === 'hadith') return '/hadith';
    if (b.kind === 'dua') return '/duas';
    return '/bookmarks';
  };

  return (
    <Page title="Bookmarks" subtitle={t('Verses, hadith and duas you saved')}>
      {!user && authReady && (
        <div className="card center">
          <p className="small">{t('Sign in to keep bookmarks across your devices.')}</p>
          <Link to="/login" className="btn btn-primary btn-block">{t('Sign in')}</Link>
        </div>
      )}

      {error && <ErrorBox message={error} onRetry={load} />}
      {user && !items && !error && <Loading />}

      {items && items.length === 0 && (
        <div className="empty">
          <AppIcon name="bookmark" size={30} />
          <p className="small">{t('No bookmarks yet. Tap the bookmark icon on a verse, hadith or dua.')}</p>
        </div>
      )}

      <div className="stack" style={{ gap: 8 }}>
        {(items || []).map((b) => (
          <div key={b.id} className="card row" style={{ justifyContent: 'space-between' }}>
            <Link to={link(b)} style={{ textDecoration: 'none', flex: 1 }}>
              <span style={{ display: 'block' }} className="small">{b.label}</span>
              <span className="tiny muted">{b.kind} · {new Date(b.createdAt).toLocaleDateString()}</span>
            </Link>
            <button className="icon-btn" aria-label={t('Remove')} onClick={() => void remove(b.id)}>
              <AppIcon name="close" size={16} />
            </button>
          </div>
        ))}
      </div>
    </Page>
  );
}
