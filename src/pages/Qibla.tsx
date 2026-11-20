import React, { useEffect, useState } from 'react';
import { Page } from '../components/Shell';
import { AppIcon } from '../components/Icons';
import { useStore } from '../lib/store';
import { qiblaBearing } from '../lib/prayer';

type OrientationEvent = DeviceOrientationEvent & { webkitCompassHeading?: number; webkitCompassAccuracy?: number };

export default function Qibla() {
  const { t, place, detectLocation, locState } = useStore();
  const [heading, setHeading] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [permissionNeeded, setPermissionNeeded] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const handler = (event: Event) => {
      const e = event as OrientationEvent;
      const compass =
        typeof e.webkitCompassHeading === 'number'
          ? e.webkitCompassHeading
          : e.alpha !== null
            ? 360 - e.alpha
            : null;
      if (compass === null) return;
      setHeading(compass);
      if (typeof e.webkitCompassAccuracy === 'number') setAccuracy(e.webkitCompassAccuracy);
    };

    const start = () => {
      if (!('DeviceOrientationEvent' in window)) {
        setSupported(false);
        return;
      }
      window.addEventListener('deviceorientationabsolute', handler, true);
      window.addEventListener('deviceorientation', handler, true);
    };

    const anyWin = window as unknown as {
      DeviceOrientationEvent?: { requestPermission?: () => Promise<string> };
    };
    if (anyWin.DeviceOrientationEvent?.requestPermission) {
      setPermissionNeeded(true);
    } else {
      start();
    }
    return () => {
      window.removeEventListener('deviceorientationabsolute', handler, true);
      window.removeEventListener('deviceorientation', handler, true);
    };
  }, []);

  const requestPermission = async () => {
    const anyWin = window as unknown as {
      DeviceOrientationEvent?: { requestPermission?: () => Promise<string> };
    };
    try {
      const result = await anyWin.DeviceOrientationEvent?.requestPermission?.();
      if (result === 'granted') {
        setPermissionNeeded(false);
        window.location.reload();
      }
    } catch {
      setPermissionNeeded(false);
    }
  };

  const bearing = place ? qiblaBearing(place.lat, place.lon) : null;
  const rotation = heading !== null && bearing !== null ? bearing - heading : bearing ?? 0;
  const cardinal = (deg: number) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
  };

  return (
    <Page title="Qibla" subtitle={place ? `${place.city} · ${place.lat.toFixed(3)}, ${place.lon.toFixed(3)}` : t('Location unavailable')}>
      {!place && (
        <div className="card">
          <p className="small" style={{ marginTop: 0 }}>{t('The Qibla direction needs your coordinates.')}</p>
          <button className="btn btn-primary btn-block" onClick={() => void detectLocation()} disabled={locState === 'locating'}>
            <AppIcon name="location" size={16} /> {locState === 'locating' ? t('Locating…') : t('Use my location')}
          </button>
        </div>
      )}

      {place && bearing !== null && (
        <div className="card center stack">
          <div className="compass" aria-hidden>
            <div className="compass-dial">
              {['N', 'E', 'S', 'W'].map((d, i) => (
                <span key={d} className={`compass-label c${i}`}>{d}</span>
              ))}
              <div className="compass-needle" style={{ transform: `rotate(${rotation}deg)` }}>
                <span className="compass-arrow" />
              </div>
            </div>
          </div>
          <p className="section-title" style={{ margin: '6px 0 0' }}>
            {bearing.toFixed(1)}° {cardinal(bearing)}
          </p>
          <p className="tiny muted" style={{ margin: 0 }}>
            {t('Direction of the Kaaba from your position')}
          </p>

          {heading === null ? (
            <div className="notice" style={{ width: '100%' }}>
              {permissionNeeded ? (
                <>
                  <p className="small" style={{ marginTop: 0 }}>{t('Allow motion access to use the live compass needle.')}</p>
                  <button className="btn btn-primary btn-sm" onClick={() => void requestPermission()}>{t('Allow compass')}</button>
                </>
              ) : supported ? (
                <p className="small" style={{ margin: 0 }}>
                  {t('No compass sensor reading yet. The bearing above is still exact — align your phone using a physical compass, or open this screen on a device with a magnetometer.')}
                </p>
              ) : (
                <p className="small" style={{ margin: 0 }}>
                  {t('This device does not expose a compass sensor. The bearing above remains accurate for your coordinates.')}
                </p>
              )}
            </div>
          ) : (
            <p className="tiny muted" style={{ margin: 0 }}>
              {t('Device heading')}: {heading.toFixed(0)}° {cardinal(heading)}
              {accuracy !== null ? ` · ${t('accuracy')} ±${accuracy.toFixed(0)}°` : ''}
            </p>
          )}
        </div>
      )}

      <div className="card">
        <h3 className="section-title">{t('Calibration guidance')}</h3>
        <ul className="small" style={{ margin: 0, paddingInlineStart: 18, lineHeight: 1.7 }}>
          <li>{t('Move away from metal objects, magnets, speakers and laptops.')}</li>
          <li>{t('Hold the phone flat and move it in a figure-eight three times.')}</li>
          <li>{t('Remove magnetic phone cases and car mounts.')}</li>
          <li>{t('Compare with a known direction such as sunrise to confirm the sensor.')}</li>
        </ul>
        <p className="tiny muted" style={{ marginBottom: 0 }}>
          {t('The Qibla bearing is calculated from the great-circle route to the Kaaba (21.4225°N, 39.8262°E) using your GPS coordinates.')}
        </p>
      </div>

      <p className="tiny muted center">
        {t('If the needle disagrees with a trusted local Qibla direction, prefer the local mosque.')}
      </p>
    </Page>
  );
}
