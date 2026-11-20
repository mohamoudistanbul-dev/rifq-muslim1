import React from 'react';
import { Link } from 'react-router-dom';
import { Page } from '../components/Shell';
import { Logo } from '../components/Shell';
import { AppIcon } from '../components/Icons';
import { useStore } from '../lib/store';

const FEATURES = [
  'Accurate prayer times from your GPS position with 12 calculation methods',
  'Complete Quran with Uthmani text, translations, recitation and bookmarks',
  'Authentic hadith from the six major collections',
  'Morning and evening adhkar, daily duas with references',
  'Qibla compass driven by the device sensors',
  'Hijri calendar, Ramadan timetable and fasting tracker',
  'Zakat calculator with live gold and silver prices',
  'Mosque and halal place finder from OpenStreetMap',
  'Kids academy, Hajj and Umrah guides, quizzes',
  'Worship tracker, tasbih counter and community',
];

export default function About() {
  const { t } = useStore();
  return (
    <Page title="About RIFQ Muslim">
      <div className="card center pattern">
        <Logo size={72} />
        <h2 className="page-title" style={{ marginBottom: 0 }}>RIFQ Muslim</h2>
        <p className="small muted" style={{ marginTop: 4 }}>{t('Your Faith, Your Daily Companion')}</p>
        <p className="badge-gold">Made by Eng Mohamud Yusuf</p>
      </div>

      <div className="card">
        <h3 className="section-title">{t('What is inside')}</h3>
        <ul className="small" style={{ margin: 0, paddingInlineStart: 18, lineHeight: 1.8 }}>
          {FEATURES.map((f) => (
            <li key={f}>{t(f)}</li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3 className="section-title">{t('Sources and honesty')}</h3>
        <p className="small">
          {t('Prayer times are computed astronomically with the Adhan library from your coordinates and timezone — never hardcoded. Quran text and translations come from the AlQuran Cloud / Tanzil datasets; hadith come from the open hadith API. Place data comes from OpenStreetMap contributors.')}
        </p>
        <p className="small muted">
          {t('Where a source is unavailable or unverified, the app says so instead of inventing content.')}
        </p>
      </div>

      <div className="card">
        <h3 className="section-title">{t('Support the app')}</h3>
        <div className="stack" style={{ gap: 8 }}>
          <Link to="/invite" className="btn btn-primary btn-block"><AppIcon name="share" size={16} /> {t('Invite friends')}</Link>
          <Link to="/contact" className="btn btn-soft btn-block"><AppIcon name="mail" size={16} /> {t('Contact the developer')}</Link>
          <Link to="/privacy" className="btn btn-ghost btn-block">{t('Privacy policy')}</Link>
        </div>
      </div>

      <p className="tiny muted center">RIFQ Muslim · v1.0.0 · {t('Made by Eng Mohamud Yusuf')}</p>
    </Page>
  );
}
