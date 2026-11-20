import React, { useEffect, useState } from 'react';
import { Page, Loading, ErrorBox } from '../components/Shell';
import { AppIcon } from '../components/Icons';
import { useStore } from '../lib/store';
import { get } from '../lib/api';

interface Place {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distanceKm: number;
  address: string;
  phone: string;
  website: string;
  cuisine: string;
  kind: string;
}

export default function Places() {
  const { t, place, detectLocation, locState } = useStore();
  const [kind, setKind] = useState<'mosque' | 'halal'>('mosque');
  const [radius, setRadius] = useState(5000);
  const [items, setItems] = useState<Place[] | null>(null);
  const [note, setNote] = useState('');
  const [source, setSource] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => {
    if (!place) return;
    setLoading(true);
    setError('');
    get<{ places: Place[]; note: string; source: string }>(
      `/places?lat=${place.lat}&lon=${place.lon}&kind=${kind}&radius=${radius}`
    )
      .then((res) => {
        setItems(res.places);
        setNote(res.note);
        setSource(res.source);
      })
      .catch((err: Error) => setError(err.message || t('Place search failed.')))
      .finally(() => setLoading(false));
  };

  useEffect(load, [kind, radius, place?.lat, place?.lon]);

  return (
    <Page title="Mosques & Halal" subtitle={place ? `${place.city} · ${t('within')} ${radius / 1000} km` : t('Location unavailable')}>
      {!place && (
        <div className="card">
          <p className="small" style={{ marginTop: 0 }}>{t('Finding nearby places needs your coordinates.')}</p>
          <button className="btn btn-primary btn-block" onClick={() => void detectLocation()} disabled={locState === 'locating'}>
            <AppIcon name="location" size={16} /> {t('Use my location')}
          </button>
        </div>
      )}

      <div className="card">
        <div className="chips">
          <button className={`chip ${kind === 'mosque' ? 'on' : ''}`} onClick={() => setKind('mosque')}>{t('Mosques')}</button>
          <button className={`chip ${kind === 'halal' ? 'on' : ''}`} onClick={() => setKind('halal')}>{t('Halal food & shops')}</button>
        </div>
        <div className="field" style={{ marginTop: 10 }}>
          <label>{t('Search radius')}</label>
          <select className="select" value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
            <option value={1000}>1 km</option>
            <option value={3000}>3 km</option>
            <option value={5000}>5 km</option>
            <option value={10000}>10 km</option>
            <option value={20000}>20 km</option>
          </select>
        </div>
      </div>

      {loading && <Loading label={t('Searching OpenStreetMap…')} />}
      {error && <ErrorBox message={error} onRetry={load} />}
      {note && <p className="tiny muted">{note}</p>}

      {items && items.length === 0 && !loading && (
        <div className="empty">
          <AppIcon name="mosque" size={28} />
          <p className="small">{t('Nothing mapped in this radius. Try a larger radius or search your city on the map.')}</p>
        </div>
      )}

      <div className="stack" style={{ gap: 8 }}>
        {(items || []).map((p) => (
          <article key={p.id} className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3 className="section-title" style={{ margin: 0 }}>{p.name}</h3>
              <span className="badge-soft tiny">{p.distanceKm} km</span>
            </div>
            {p.address && <p className="tiny muted" style={{ margin: '6px 0 0' }}>{p.address}</p>}
            {p.cuisine && <p className="tiny muted" style={{ margin: '4px 0 0' }}>{p.cuisine}</p>}
            <div className="btn-row" style={{ marginTop: 10 }}>
              <a
                className="btn btn-soft btn-sm"
                href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`}
                target="_blank"
                rel="noreferrer"
              >
                <AppIcon name="compass" size={14} /> {t('Directions')}
              </a>
              {p.phone && (
                <a className="btn btn-soft btn-sm" href={`tel:${p.phone}`}>
                  <AppIcon name="phone" size={14} /> {t('Call')}
                </a>
              )}
              {p.website && (
                <a className="btn btn-soft btn-sm" href={p.website} target="_blank" rel="noreferrer">
                  {t('Website')}
                </a>
              )}
            </div>
          </article>
        ))}
      </div>

      {source && (
        <p className="tiny muted center">
          {t('Data')}: {source}. {t('Halal certification and opening hours are not verified — please confirm with the place directly.')}
        </p>
      )}
    </Page>
  );
}
