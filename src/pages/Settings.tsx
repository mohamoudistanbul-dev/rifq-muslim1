import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Page } from '../components/Shell';
import { AppIcon } from '../components/Icons';
import { useStore } from '../lib/store';
import { LANGS, type Lang } from '../lib/i18n';
import { HIGH_LAT, METHODS, type CalcOptions, type HighLat, type MethodId } from '../lib/prayer';
import { local } from '../lib/api';

export default function Settings() {
  const { t, lang, setLang, theme, toggleTheme, calc, setCalc, prefs, setPrefs, place, clearPlace, detectLocation, user, logout, toast } = useStore();
  const navigate = useNavigate();

  const set = (patch: Partial<CalcOptions>) => setCalc({ ...calc, ...patch });
  const pref = (patch: Partial<typeof prefs>) => setPrefs(patch);

  const clearDownloads = () => {
    local.remove('surah-cache');
    local.remove('quran-translation');
    toast(t('Downloaded Quran text removed from this device'), 'success');
  };

  return (
    <Page title="Settings" subtitle={t('Everything about your experience')}>
      <div className="card">
        <h3 className="section-title">{t('Language')}</h3>
        <div className="chips">
          {LANGS.map((l) => (
            <button key={l.code} className={`chip ${lang === l.code ? 'active' : ''}`} onClick={() => setLang(l.code as Lang)}>
              {l.native}
            </button>
          ))}
        </div>
        <p className="tiny muted" style={{ marginBottom: 0 }}>
          {t('Arabic switches the interface to right-to-left layout.')}
        </p>
      </div>

      <div className="card">
        <h3 className="section-title">{t('Appearance')}</h3>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="small">{t('Dark theme')}</span>
          <button className={`switch ${theme === 'dark' ? 'on' : ''}`} onClick={toggleTheme} aria-label={t('Toggle dark theme')} />
        </div>
        <div className="row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
          <span className="small">{t('24-hour clock')}</span>
          <button className={`switch ${!prefs.hour12 ? 'on' : ''}`} onClick={() => pref({ hour12: !prefs.hour12 })} aria-label={t('Toggle 24-hour clock')} />
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">{t('Prayer calculation')}</h3>
        <div className="field">
          <label>{t('Calculation method')}</label>
          <select className="select" value={calc.method} onChange={(e) => set({ method: e.target.value as MethodId })}>
            {METHODS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>{t('Asr method')}</label>
          <div className="chips">
            <button className={`chip ${calc.madhab === 'shafi' ? 'active' : ''}`} onClick={() => set({ madhab: 'shafi' })}>
              {t('Standard (Shafi, Maliki, Hanbali)')}
            </button>
            <button className={`chip ${calc.madhab === 'hanafi' ? 'active' : ''}`} onClick={() => set({ madhab: 'hanafi' })}>
              {t('Hanafi')}
            </button>
          </div>
        </div>
        <div className="field">
          <label>{t('High latitude adjustment')}</label>
          <select className="select" value={calc.highLatitude} onChange={(e) => set({ highLatitude: e.target.value as HighLat })}>
            {HIGH_LAT.map((h) => (
              <option key={h.id} value={h.id}>{t(h.label)}</option>
            ))}
          </select>
        </div>
        <Link to="/prayer" className="btn btn-soft btn-block">{t('Compare with your local mosque')}</Link>
      </div>

      <div className="card">
        <h3 className="section-title">{t('Location')}</h3>
        <p className="small">
          {place
            ? `${place.city}${place.region ? `, ${place.region}` : ''} — ${place.country} ${place.flag || ''} (${place.timezone})`
            : t('Location unavailable')}
          {place?.manual ? ` · ${t('manually selected')}` : place ? ` · ${t('from GPS')}` : ''}
        </p>
        <div className="grid grid-2">
          <button className="btn btn-primary" onClick={() => void detectLocation()}>
            <AppIcon name="location" size={16} /> {t('Use GPS')}
          </button>
          <button className="btn btn-soft" onClick={() => navigate('/prayer?pick=1')}>{t('Choose manually')}</button>
        </div>
        {place && (
          <button className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={clearPlace}>
            {t('Clear saved location')}
          </button>
        )}
      </div>

      <div className="card">
        <h3 className="section-title">{t('Notifications and audio')}</h3>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="small">{t('Prayer notifications')}</span>
          <button className={`switch ${prefs.notifyEnabled ? 'on' : ''}`} onClick={() => pref({ notifyEnabled: !prefs.notifyEnabled })} aria-label={t('Toggle prayer notifications')} />
        </div>
        <div className="grid grid-2" style={{ marginTop: 10 }}>
          <Link to="/athan" className="btn btn-soft">{t('Athan settings')}</Link>
          <Link to="/athan" className="btn btn-soft">{t('Reminders')}</Link>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">{t('Quran reading')}</h3>
        <div className="field">
          <label>{t('Arabic font size')}: {prefs.quranFontSize}px</label>
          <input
            className="input"
            type="range"
            min={20}
            max={44}
            value={prefs.quranFontSize}
            onChange={(e) => pref({ quranFontSize: Number(e.target.value) })}
          />
        </div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="small">{t('Daily verse reminder')}</span>
          <button className={`switch ${prefs.dailyQuran ? 'on' : ''}`} onClick={() => pref({ dailyQuran: !prefs.dailyQuran })} aria-label={t('Toggle daily verse')} />
        </div>
        <div className="row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
          <span className="small">{t('Daily hadith reminder')}</span>
          <button className={`switch ${prefs.dailyHadith ? 'on' : ''}`} onClick={() => pref({ dailyHadith: !prefs.dailyHadith })} aria-label={t('Toggle daily hadith')} />
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">{t('Offline')}</h3>
        <p className="small">{t('Downloaded Quran text, bookmarks and saved duas stay available without internet. Audio and the place finder need a connection.')}</p>
        <button className="btn btn-ghost btn-block" onClick={clearDownloads}>{t('Remove downloaded text')}</button>
      </div>

      <div className="card">
        <h3 className="section-title">{t('Account and privacy')}</h3>
        <div className="stack" style={{ gap: 8 }}>
          {user ? (
            <>
              <Link to="/profile" className="btn btn-soft btn-block"><AppIcon name="user" size={16} /> {t('My profile')}</Link>
              <button className="btn btn-ghost btn-block" onClick={() => void logout()}>{t('Sign out')}</button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary btn-block">{t('Sign in or create an account')}</Link>
          )}
          <Link to="/privacy" className="btn btn-ghost btn-block"><AppIcon name="shield" size={16} /> {t('Privacy')}</Link>
          <Link to="/about" className="btn btn-ghost btn-block">{t('About RIFQ Muslim')}</Link>
        </div>
      </div>
    </Page>
  );
}
