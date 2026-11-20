import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Page, Loading } from '../components/Shell';
import { AppIcon } from '../components/Icons';
import { useStore } from '../lib/store';
import { patch, post, del } from '../lib/api';
import { LANGS, type Lang } from '../lib/i18n';

export default function Profile() {
  const { t, user, authReady, refreshUser, logout, lang, setLang, toast } = useStore();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [pw, setPw] = useState({ current: '', next: '' });
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState('');

  useEffect(() => {
    if (authReady && !user) navigate('/login?next=/profile', { replace: true });
    if (user) setName(user.name);
  }, [authReady, user, navigate]);

  if (!authReady) return <Page title="Profile"><Loading /></Page>;
  if (!user) return <Page title="Profile"><p className="small">{t('Redirecting to sign in…')}</p></Page>;

  const saveProfile = async () => {
    setBusy(true);
    try {
      await patch('/auth/profile', { name, lang });
      await refreshUser();
      toast(t('Profile saved'), 'success');
    } catch (err) {
      toast((err as Error).message || t('The profile could not be saved'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async () => {
    setBusy(true);
    try {
      await post('/auth/password', { currentPassword: pw.current, newPassword: pw.next });
      setPw({ current: '', next: '' });
      toast(t('Password updated. Other sessions were signed out.'), 'success');
    } catch (err) {
      toast((err as Error).message || t('The password could not be changed'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    if (confirmDelete !== 'DELETE') return toast(t('Type DELETE to confirm'), 'error');
    setBusy(true);
    try {
      await del('/auth/account');
      await refreshUser();
      toast(t('Your account has been deleted'), 'success');
      navigate('/');
    } catch (err) {
      toast((err as Error).message || t('The account could not be deleted'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page title="Profile" subtitle={user.email}>
      <div className="card center">
        <div className="tile-icon" style={{ margin: '0 auto 8px', width: 64, height: 64, fontSize: 26 }}>
          {user.name.slice(0, 1).toUpperCase()}
        </div>
        <h3 className="section-title" style={{ marginBottom: 2 }}>{user.name}</h3>
        <p className="tiny muted" style={{ margin: 0 }}>
          {user.emailVerified ? t('Email verified') : t('Email not verified yet')}
          {user.role === 'admin' ? ` · ${t('Administrator')}` : ''}
        </p>
      </div>

      <div className="card">
        <h3 className="section-title">{t('Edit profile')}</h3>
        <div className="field">
          <label>{t('Name')}</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>{t('Language')}</label>
          <select className="select" value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
            {LANGS.map((l) => (
              <option key={l.code} value={l.code}>{l.native}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary btn-block" onClick={() => void saveProfile()} disabled={busy}>
          {t('Save profile')}
        </button>
      </div>

      <div className="card">
        <h3 className="section-title">{t('Change password')}</h3>
        <div className="field">
          <label>{t('Current password')}</label>
          <input className="input" type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
        </div>
        <div className="field">
          <label>{t('New password')}</label>
          <input className="input" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
        </div>
        <button className="btn btn-soft btn-block" onClick={() => void changePassword()} disabled={busy}>
          {t('Update password')}
        </button>
      </div>

      <div className="card">
        <h3 className="section-title">{t('Shortcuts')}</h3>
        <div className="grid grid-2">
          <Link to="/tracker" className="btn btn-soft"><AppIcon name="check" size={16} /> {t('Tracker')}</Link>
          <Link to="/bookmarks" className="btn btn-soft"><AppIcon name="bookmark" size={16} /> {t('Bookmarks')}</Link>
          <Link to="/settings" className="btn btn-soft"><AppIcon name="settings" size={16} /> {t('Settings')}</Link>
          <Link to="/privacy" className="btn btn-soft"><AppIcon name="shield" size={16} /> {t('Privacy')}</Link>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">{t('Session')}</h3>
        <button className="btn btn-ghost btn-block" onClick={() => void logout()}>{t('Sign out')}</button>
      </div>

      <div className="card" style={{ borderColor: 'var(--danger)' }}>
        <h3 className="section-title" style={{ color: 'var(--danger)' }}>{t('Delete account')}</h3>
        <p className="small">{t('This permanently removes your profile, bookmarks, tracker history and posts. It cannot be undone.')}</p>
        <input className="input" placeholder={t('Type DELETE to confirm')} value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} />
        <button className="btn btn-block" style={{ marginTop: 8, background: 'var(--danger)', color: '#fff' }} onClick={() => void deleteAccount()} disabled={busy}>
          {t('Delete my account permanently')}
        </button>
      </div>
    </Page>
  );
}
