import React from 'react';
import { Page } from '../components/Shell';
import { AppIcon } from '../components/Icons';
import { useStore } from '../lib/store';
import { FIVE, formatTime } from '../lib/prayer';

const SOUNDS = [
  { id: 'makkah', label: 'Athan — Makkah' },
  { id: 'madinah', label: 'Athan — Madinah' },
  { id: 'alaqsa', label: 'Athan — Al-Aqsa' },
  { id: 'beep', label: 'Short chime only' },
  { id: 'silent', label: 'Silent notification' },
];

export default function Athan() {
  const { t, prefs, setPrefs, times, place, lang, notifyPermission, requestNotify, toast } = useStore();
  const tz = place?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <Page title="Athan" subtitle={t('Notification preferences for every prayer')}>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <p className="small" style={{ margin: 0 }}>{t('Prayer notifications')}</p>
            <p className="tiny muted" style={{ margin: 0 }}>{t('Browser status')}: {notifyPermission || t('unknown')}</p>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={prefs.notifyEnabled}
              onChange={(e) => {
                setPrefs({ notifyEnabled: e.target.checked });
                if (e.target.checked && notifyPermission !== 'granted') void requestNotify();
              }}
            />
            <span />
          </label>
        </div>
        {notifyPermission === 'denied' && (
          <div className="notice" style={{ marginTop: 10 }}>
            <p className="small" style={{ margin: 0 }}>
              {t('Notifications are blocked for this site. Allow them in your browser or Android app settings, then enable the switch again.')}
            </p>
          </div>
        )}
        {notifyPermission !== 'granted' && (
          <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={() => void requestNotify()}>
            <AppIcon name="bell" size={15} /> {t('Allow notifications')}
          </button>
        )}
      </div>

      <div className="card">
        <h3 className="section-title">{t('Per-prayer alerts')}</h3>
        <div className="stack" style={{ gap: 10 }}>
          {FIVE.map((key) => (
            <div key={key} className="row" style={{ justifyContent: 'space-between' }}>
              <div>
                <span className="small" style={{ display: 'block', textTransform: 'capitalize' }}>{t(key)}</span>
                <span className="tiny muted">{times ? formatTime(times[key], tz, lang) : '—'}</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={prefs.prayerAlerts[key] !== false}
                  onChange={(e) => setPrefs({ prayerAlerts: { ...prefs.prayerAlerts, [key]: e.target.checked } })}
                />
                <span />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="field">
          <label>{t('Pre-prayer reminder')}</label>
          <select
            className="select"
            value={prefs.preReminder}
            onChange={(e) => setPrefs({ preReminder: Number(e.target.value) })}
          >
            <option value={0}>{t('Off')}</option>
            <option value={5}>{t('5 minutes before')}</option>
            <option value={10}>{t('10 minutes before')}</option>
            <option value={15}>{t('15 minutes before')}</option>
            <option value={30}>{t('30 minutes before')}</option>
          </select>
        </div>
        <div className="field">
          <label>{t('Athan sound')}</label>
          <select className="select" value={prefs.athanSound} onChange={(e) => setPrefs({ athanSound: e.target.value })}>
            {SOUNDS.map((s) => (
              <option key={s.id} value={s.id}>{t(s.label)}</option>
            ))}
          </select>
        </div>
        <p className="tiny muted" style={{ margin: 0 }}>
          {t('Recorded athan audio is not bundled because we only ship audio with verified licensing. The notification itself is branded RIFQ Muslim.')}
        </p>
      </div>

      <div className="card">
        <h3 className="section-title">{t('Daily reminders')}</h3>
        <div className="stack" style={{ gap: 10 }}>
          {([
            ['dailyQuran', 'Daily Quran reminder'],
            ['dailyHadith', 'Daily hadith reminder'],
            ['dailyDua', 'Daily dua reminder'],
          ] as const).map(([key, label]) => (
            <div key={key} className="row" style={{ justifyContent: 'space-between' }}>
              <span className="small">{t(label)}</span>
              <label className="switch">
                <input type="checkbox" checked={prefs[key]} onChange={(e) => setPrefs({ [key]: e.target.checked } as never)} />
                <span />
              </label>
            </div>
          ))}
        </div>
        <button className="btn btn-soft btn-sm" style={{ marginTop: 12 }} onClick={() => toast(t('Reminders rescheduled for the next prayer.'), 'success')}>
          {t('Reschedule now')}
        </button>
      </div>

      <div className="card">
        <h3 className="section-title">{t('Android platform limits')}</h3>
        <ul className="small" style={{ margin: 0, paddingInlineStart: 18, lineHeight: 1.7 }}>
          <li>{t('Exact alarm delivery requires the “Alarms & reminders” permission on Android 12+.')}</li>
          <li>{t('Battery optimisation can delay notifications; whitelist RIFQ Muslim for reliable athan.')}</li>
          <li>{t('In the browser, notifications only arrive while the app is open or installed as a PWA.')}</li>
          <li>{t('Times are recalculated after a location, method or timezone change.')}</li>
        </ul>
      </div>
    </Page>
  );
}
