import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Page, Loading, ErrorBox, TopBar } from '../components/Shell';
import { AppIcon } from '../components/Icons';
import { useStore } from '../lib/store';
import { get, post, local } from '../lib/api';

interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

interface Ayah {
  number: number;
  text: string;
  juz: number;
  page: number;
  hizbQuarter: number;
  sajda: boolean;
  translation: string;
}

interface SurahData {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  ayahCount: number;
  translationEdition: string;
  ayahs: Ayah[];
  source: string;
}

const TRANSLATIONS = [
  { id: 'en.sahih', label: 'English — Saheeh International' },
  { id: 'en.pickthall', label: 'English — Pickthall' },
  { id: 'so.abduh', label: 'Somali — Abduh' },
  { id: 'fr.hamidullah', label: 'French — Hamidullah' },
  { id: 'tr.diyanet', label: 'Turkish — Diyanet' },
];

const RECITERS = [
  { id: 'ar.alafasy', label: 'Mishary al-Afasy' },
  { id: 'ar.abdulbasitmurattal', label: 'Abdul Basit (Murattal)' },
  { id: 'ar.husary', label: 'Mahmoud al-Husary' },
  { id: 'ar.minshawi', label: 'Muhammad al-Minshawi' },
  { id: 'ar.shaatree', label: 'Abu Bakr al-Shatri' },
];

export default function QuranList() {
  const { t, user, toast } = useStore();
  const [surahs, setSurahs] = useState<SurahMeta[] | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [verseQuery, setVerseQuery] = useState('');
  const [matches, setMatches] = useState<{ surah: number; surahName: string; ayah: number; text: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const lastRead = local.get<{ surah: number; ayah: number; name: string } | null>('lastRead', null);

  const load = () => {
    setError('');
    get<{ surahs: SurahMeta[] }>('/quran/surahs')
      .then((res) => {
        setSurahs(res.surahs);
        local.set('surahIndex', res.surahs);
      })
      .catch(() => {
        const cached = local.get<SurahMeta[] | null>('surahIndex', null);
        if (cached) {
          setSurahs(cached);
          setError(t('Showing the saved Quran index — you are offline.'));
        } else {
          setError(t('The Quran index could not be loaded. Check your connection and retry.'));
        }
      });
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    if (!surahs) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return surahs;
    return surahs.filter(
      (s) =>
        s.englishName.toLowerCase().includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        s.name.includes(filter.trim()) ||
        String(s.number) === q
    );
  }, [surahs, filter]);

  const searchVerses = async () => {
    const q = verseQuery.trim();
    if (q.length < 3) return toast(t('Type at least 3 characters'), 'error');
    setSearching(true);
    try {
      const res = await get<{ matches: typeof matches }>(`/quran/search?q=${encodeURIComponent(q)}`);
      setMatches(res.matches);
      if (!res.matches.length) toast(t('No verse matched that search'), 'info');
    } catch {
      toast(t('Verse search is unavailable right now'), 'error');
    } finally {
      setSearching(false);
    }
  };

  return (
    <Page title="Quran" subtitle={t('114 surahs · Uthmani script · audio and translations')} back={false}>
      {lastRead && (
        <Link to={`/quran/${lastRead.surah}`} className="card row" style={{ justifyContent: 'space-between', textDecoration: 'none' }}>
          <span className="row" style={{ gap: 10 }}>
            <AppIcon name="book" size={18} />
            <span>
              <span className="small" style={{ display: 'block' }}>{t('Continue reading')}</span>
              <span className="tiny muted">{lastRead.name} · {t('Ayah')} {lastRead.ayah}</span>
            </span>
          </span>
          <AppIcon name="chevron" size={16} />
        </Link>
      )}

      <div className="card">
        <input className="input" placeholder={t('Search surah by name or number')} value={filter} onChange={(e) => setFilter(e.target.value)} />
        <div className="row" style={{ gap: 8, marginTop: 10 }}>
          <input
            className="input"
            placeholder={t('Search inside the Quran')}
            value={verseQuery}
            onChange={(e) => setVerseQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void searchVerses()}
          />
          <button className="btn btn-primary" onClick={() => void searchVerses()}>
            <AppIcon name="search" size={16} />
          </button>
        </div>
        {searching && <Loading />}
        {matches.length > 0 && (
          <div className="stack" style={{ marginTop: 12, gap: 8 }}>
            <p className="tiny muted" style={{ margin: 0 }}>{t('Verse results')}</p>
            {matches.slice(0, 20).map((m, i) => (
              <Link key={`${m.surah}-${m.ayah}-${i}`} to={`/quran/${m.surah}?ayah=${m.ayah}`} className="card" style={{ textDecoration: 'none', padding: 12 }}>
                <p className="small" style={{ margin: 0 }}>{m.text}</p>
                <p className="tiny muted" style={{ margin: '6px 0 0' }}>{m.surahName} · {m.surah}:{m.ayah}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {error && <ErrorBox message={error} onRetry={load} />}
      {!surahs && !error && <Loading />}

      <div className="stack" style={{ gap: 6 }}>
        {filtered.map((s) => (
          <Link key={s.number} to={`/quran/${s.number}`} className="surah-item">
            <span className="surah-num">{s.number}</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: 'block' }}>{s.englishName}</span>
              <span className="tiny muted">
                {s.englishNameTranslation} · {s.numberOfAyahs} {t('ayahs')} · {s.revelationType}
              </span>
            </span>
            <span className="arabic" style={{ fontSize: 20 }}>{s.name.replace('سُورَةُ ', '')}</span>
          </Link>
        ))}
      </div>
      <p className="tiny muted center">
        {t('Quran text and translations are provided by AlQuran Cloud. RIFQ never alters the scripture.')}
      </p>
    </Page>
  );
}

export function QuranReader() {
  const { number } = useParams();
  const surahNumber = Math.min(114, Math.max(1, Number(number) || 1));
  const { t, prefs, setPrefs, user, toast } = useStore();
  const [data, setData] = useState<SurahData | null>(null);
  const [error, setError] = useState('');
  const [translation, setTranslation] = useState(() => local.get('translation', 'en.sahih'));
  const [reciter, setReciter] = useState(() => local.get('reciter', 'ar.alafasy'));
  const [playing, setPlaying] = useState(false);
  const [bookmarked, setBookmarked] = useState<Record<number, boolean>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const query = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const jumpTo = Number(query.get('ayah') || 0);

  const load = () => {
    setError('');
    get<SurahData>(`/quran/surah/${surahNumber}?translation=${translation}`)
      .then((res) => {
        setData(res);
        local.set(`surah.${surahNumber}.${translation}`, res);
        local.set('lastRead', { surah: res.number, ayah: 1, name: res.englishName });
      })
      .catch(() => {
        const cached = local.get<SurahData | null>(`surah.${surahNumber}.${translation}`, null);
        if (cached) {
          setData(cached);
          setError(t('Offline copy — saved on this device.'));
        } else {
          setError(t('This surah could not be loaded. Check your connection and retry.'));
        }
      });
  };

  useEffect(load, [surahNumber, translation]);

  useEffect(() => {
    if (!data) return;
    const el = document.getElementById(`ayah-${jumpTo || 1}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [data, jumpTo]);

  useEffect(() => {
    local.set('translation', translation);
    local.set('reciter', reciter);
  }, [translation, reciter]);

  const toggleBookmark = async (ayah: Ayah) => {
    if (!user) return toast(t('Sign in to save bookmarks'), 'error');
    try {
      const res = await post<{ removed?: boolean }>('/bookmarks', {
        kind: 'quran',
        ref: `quran:${surahNumber}:${ayah.number}`,
        surah: surahNumber,
        ayah: ayah.number,
        label: `${data?.englishName} ${surahNumber}:${ayah.number}`,
      });
      setBookmarked((b) => ({ ...b, [ayah.number]: !res.removed }));
      toast(res.removed ? t('Bookmark removed') : t('Bookmark saved'), 'success');
    } catch {
      toast(t('The bookmark could not be saved'), 'error');
    }
  };

  const toggleAudio = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.play()
        .then(() => setPlaying(true))
        .catch(() => toast(t('Audio playback was blocked by the browser'), 'error'));
    }
  };

  const audioUrl = `https://cdn.islamic.network/quran/audio-surah/128/${reciter}/${surahNumber}.mp3`;

  return (
    <>
      <TopBar back />
      <div className="wrap">
        <div className="page-head">
          <div>
            <h1 className="page-title">{data?.englishName || `${t('Surah')} ${surahNumber}`}</h1>
            <p className="page-sub">
              {data ? `${data.englishNameTranslation} · ${data.ayahCount} ${t('ayahs')} · ${data.revelationType}` : t('Loading')}
            </p>
          </div>
        </div>

        {error && <ErrorBox message={error} onRetry={load} />}
        {!data && !error && <Loading />}

        {data && (
          <>
            <div className="card">
              <p className="arabic-lg center" dir="rtl" lang="ar" style={{ margin: 0 }}>{data.name}</p>
              <div className="divider" />
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-primary btn-sm" onClick={toggleAudio}>
                  <AppIcon name={playing ? 'pause' : 'play'} size={15} /> {playing ? t('Pause') : t('Play surah')}
                </button>
                <button
                  className="btn btn-soft btn-sm"
                  onClick={() => setPrefs({ quranFontSize: Math.min(44, prefs.quranFontSize + 2) })}
                >
                  A+
                </button>
                <button
                  className="btn btn-soft btn-sm"
                  onClick={() => setPrefs({ quranFontSize: Math.max(18, prefs.quranFontSize - 2) })}
                >
                  A−
                </button>
              </div>
              <audio ref={audioRef} src={audioUrl} onEnded={() => setPlaying(false)} preload="none" />
              <div className="field" style={{ marginTop: 12 }}>
                <label>{t('Reciter')}</label>
                <select className="select" value={reciter} onChange={(e) => setReciter(e.target.value)}>
                  {RECITERS.map((r) => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>{t('Translation')}</label>
                <select className="select" value={translation} onChange={(e) => setTranslation(e.target.value)}>
                  {TRANSLATIONS.map((tr) => (
                    <option key={tr.id} value={tr.id}>{tr.label}</option>
                  ))}
                </select>
              </div>
              <p className="tiny muted" style={{ marginBottom: 0 }}>{data.source}</p>
            </div>

            {surahNumber !== 1 && surahNumber !== 9 && (
              <p className="arabic center" dir="rtl" lang="ar" style={{ fontSize: 26, margin: '14px 0' }}>
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
            )}

            <div className="stack" style={{ gap: 10 }}>
              {data.ayahs.map((ayah) => (
                <article key={ayah.number} id={`ayah-${ayah.number}`} className="card" style={{ scrollMarginTop: 90 }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="ayah-num">{surahNumber}:{ayah.number}</span>
                    <span className="tiny muted">Juz {ayah.juz} · {t('Page')} {ayah.page}</span>
                  </div>
                  <p className="arabic" dir="rtl" lang="ar" style={{ fontSize: prefs.quranFontSize, lineHeight: 2.1, margin: '10px 0' }}>
                    {ayah.text}
                  </p>
                  <p className="small" style={{ margin: 0 }}>{ayah.translation}</p>
                  <div className="ayah-actions">
                    <button className="icon-btn" onClick={() => void toggleBookmark(ayah)} aria-label={t('Bookmark')}>
                      <AppIcon name="bookmark" size={17} />
                    </button>
                    <button
                      className="icon-btn"
                      aria-label={t('Share')}
                      onClick={() => {
                        const text = `${ayah.text}\n\n${ayah.translation}\n— Quran ${surahNumber}:${ayah.number}`;
                        if (navigator.share) void navigator.share({ title: data.englishName, text });
                        else void navigator.clipboard.writeText(text).then(() => toast(t('Copied'), 'success'));
                      }}
                    >
                      <AppIcon name="share" size={17} />
                    </button>
                    {bookmarked[ayah.number] && <span className="tiny" style={{ color: 'var(--gold-deep)' }}>{t('Saved')}</span>}
                  </div>
                </article>
              ))}
            </div>

            <div className="btn-row" style={{ marginTop: 14 }}>
              {surahNumber > 1 && (
                <Link className="btn btn-soft" to={`/quran/${surahNumber - 1}`}>
                  <AppIcon name="back" size={15} /> {t('Previous')}
                </Link>
              )}
              {surahNumber < 114 && (
                <Link className="btn btn-primary" to={`/quran/${surahNumber + 1}`}>
                  {t('Next')} <AppIcon name="chevron" size={15} />
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
