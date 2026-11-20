import React, { useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { LANGS, type Lang } from '../lib/i18n';
import { AppIcon } from './Icons';

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <img
      src="/icons/icon-192.png"
      alt="RIFQ Muslim"
      width={size}
      height={size}
      className="brand-logo"
      style={{ width: size, height: size, objectFit: 'contain', borderRadius: 12 }}
    />
  );
}

export function TopBar({ title, back, actions }: { title?: string; back?: boolean; actions?: React.ReactNode }) {
  const { lang, setLang, t, user } = useStore();
  const navigate = useNavigate();
  return (
    <header className="topbar">
      <div className="topbar-inner">
        {back ? (
          <button className="icon-btn rtl-flip" onClick={() => navigate(-1)} aria-label={t('Back')}>
            <AppIcon name="back" />
          </button>
        ) : (
          <div className="row" style={{ gap: 10 }}>
            <Logo size={36} />
            <div>
              <div className="brand-name">RIFQ Muslim</div>
              <div className="brand-tag">{title || t('Your Faith, Your Daily Companion')}</div>
            </div>
          </div>
        )}
        <div className="row" style={{ gap: 6 }}>
          {actions}
          <select
            className="select"
            aria-label={t('Language')}
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            style={{ width: 'auto', padding: '8px 10px', fontSize: 13 }}
          >
            {LANGS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.native}
              </option>
            ))}
          </select>
          <NavLink to="/athan" className="icon-btn" aria-label={t('Notifications')}>
            <AppIcon name="bell" />
          </NavLink>
          <NavLink to={user ? '/profile' : '/login'} className="icon-btn" aria-label={t('Profile')}>
            <AppIcon name="user" />
          </NavLink>
        </div>
      </div>
    </header>
  );
}

export function Page({
  title,
  subtitle,
  back = true,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { t } = useStore();
  return (
    <>
      <TopBar back={back} actions={actions} />
      <div className="wrap">
        <div className="page-head">
          <div>
            <h1 className="page-title">{t(title)}</h1>
            {subtitle && <p className="page-sub">{subtitle}</p>}
          </div>
          {actions}
        </div>
        {children}
      </div>
    </>
  );
}

const NAV = [
  { to: '/', icon: 'home' as const, label: 'Home' },
  { to: '/quran', icon: 'quran' as const, label: 'Quran' },
  { to: '/prayer', icon: 'mosque' as const, label: 'Prayer' },
  { to: '/tasbih', icon: 'beads' as const, label: 'Tasbih' },
  { to: '/more', icon: 'more' as const, label: 'More' },
];

export function BottomNav() {
  const { t } = useStore();
  const { pathname } = useLocation();
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <div className="bottom-nav-inner">
        {NAV.map((item) => {
          const active = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to);
          return (
            <NavLink key={item.to} to={item.to} className={`nav-item ${active ? 'active' : ''}`}>
              <AppIcon name={item.icon} size={21} />
              <span>{t(item.label)}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export function Toasts() {
  const { toasts } = useStore();
  if (!toasts.length) return null;
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 88,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        zIndex: 200,
        pointerEvents: 'none',
        padding: '0 16px',
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="notice"
          style={{
            maxWidth: 420,
            width: '100%',
            boxShadow: '0 10px 30px rgba(0,0,0,.28)',
            borderLeft: `3px solid ${toast.kind === 'error' ? '#e0655b' : 'var(--gold)'}`,
          }}
          role="status"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2 className="section-title" style={{ margin: 0 }}>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <AppIcon name="close" size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Loading({ label }: { label?: string }) {
  const { t } = useStore();
  return (
    <div className="center stack" style={{ padding: 40 }}>
      <div className="spinner" />
      <p className="muted small">{label || t('Loading')}</p>
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useStore();
  return (
    <div className="card" style={{ borderColor: 'rgba(224,101,91,.5)' }}>
      <p className="small" style={{ margin: 0 }}>{message}</p>
      {onRetry && (
        <button className="btn btn-soft btn-sm" style={{ marginTop: 10 }} onClick={onRetry}>
          <AppIcon name="refresh" size={16} /> {t('Retry')}
        </button>
      )}
    </div>
  );
}
