import React from 'react';
import { Link } from 'react-router-dom';
import { Page } from '../components/Shell';
import { AppIcon, type IconName } from '../components/Icons';
import { useStore } from '../lib/store';

interface Item {
  to: string;
  icon: IconName;
  label: string;
  desc: string;
  adminOnly?: boolean;
  authOnly?: boolean;
}

const ITEMS: Item[] = [
  { to: '/qibla', icon: 'compass', label: 'Qibla', desc: 'Direction to the Kaaba' },
  { to: '/duas', icon: 'heart', label: 'Duas', desc: 'Adhkar for every moment' },
  { to: '/hadith', icon: 'book', label: 'Hadith', desc: 'Six authentic collections' },
  { to: '/calendar', icon: 'calendar', label: 'Calendar', desc: 'Hijri dates and Ramadan' },
  { to: '/bookmarks', icon: 'bookmark', label: 'Bookmarks', desc: 'Your saved verses' },
  { to: '/athan', icon: 'bell', label: 'Athan', desc: 'Notifications and sound' },
  { to: '/tracker', icon: 'check', label: 'Tracker', desc: 'Worship and daily goals' },
  { to: '/quiz', icon: 'star', label: 'Quiz', desc: 'Test your knowledge' },
  { to: '/zakat', icon: 'star', label: 'Zakat', desc: 'Nisab calculator' },
  { to: '/places', icon: 'mosque', label: 'Mosques & Halal', desc: 'Nearby places' },
  { to: '/kids', icon: 'heart', label: 'Kids Academy', desc: 'Learning for children' },
  { to: '/hajj', icon: 'mosque', label: 'Hajj & Umrah', desc: 'Step-by-step guide' },
  { to: '/assistant', icon: 'chat', label: 'Assistant', desc: 'Ask with references' },
  { to: '/community', icon: 'chat', label: 'Community', desc: 'Moderated discussion' },
  { to: '/invite', icon: 'share', label: 'Invite Friends', desc: 'Share RIFQ Muslim' },
  { to: '/contact', icon: 'mail', label: 'Contact', desc: 'Reach the developer' },
  { to: '/settings', icon: 'settings', label: 'Settings', desc: 'Language, theme, audio' },
  { to: '/profile', icon: 'user', label: 'Profile', desc: 'Your account', authOnly: true },
  { to: '/admin', icon: 'shield', label: 'Admin', desc: 'Owner dashboard', adminOnly: true },
  { to: '/about', icon: 'star', label: 'About RIFQ Muslim', desc: 'Version and credits' },
  { to: '/privacy', icon: 'shield', label: 'Privacy', desc: 'How data is handled' },
];

export default function More() {
  const { t, user, theme, toggleTheme, lang, setLang } = useStore();
  const items = ITEMS.filter((i) => (!i.adminOnly || user?.role === 'admin') && (!i.authOnly || user));

  return (
    <Page title="More" subtitle={t('Everything else in RIFQ Muslim')} back={false}>
      <div className="card row" style={{ justifyContent: 'space-between' }}>
        <div>
          <p className="small" style={{ margin: 0 }}>{user ? user.name : t('Guest mode')}</p>
          <p className="tiny muted" style={{ margin: 0 }}>
            {user ? user.email : t('Sign in to sync your worship records')}
          </p>
        </div>
        <div className="btn-row">
          <button className="btn btn-soft btn-sm" onClick={toggleTheme}>
            <AppIcon name={theme === 'dark' ? 'sun' : 'moon'} size={15} />
          </button>
          <select className="select" value={lang} onChange={(e) => setLang(e.target.value as 'en' | 'ar' | 'so')} style={{ width: 'auto', padding: '8px 10px' }}>
            <option value="en">EN</option>
            <option value="ar">ع</option>
            <option value="so">SO</option>
          </select>
        </div>
      </div>

      {!user && (
        <div className="btn-row">
          <Link to="/login" className="btn btn-primary" style={{ flex: 1 }}>{t('Sign in')}</Link>
          <Link to="/register" className="btn btn-soft" style={{ flex: 1 }}>{t('Create account')}</Link>
        </div>
      )}

      <div className="stack" style={{ gap: 8 }}>
        {items.map((item) => (
          <Link key={item.to} to={item.to} className="card row" style={{ textDecoration: 'none', justifyContent: 'space-between' }}>
            <span className="row" style={{ gap: 12 }}>
              <span className="tile-icon"><AppIcon name={item.icon} size={19} /></span>
              <span>
                <span style={{ display: 'block' }}>{t(item.label)}</span>
                <span className="tiny muted">{t(item.desc)}</span>
              </span>
            </span>
            <AppIcon name="chevron" size={16} />
          </Link>
        ))}
      </div>

      <p className="tiny muted center" style={{ marginTop: 18 }}>
        RIFQ Muslim v1.0.0 · {t('Made by Eng Mohamud Yusuf')}
      </p>
    </Page>
  );
}
