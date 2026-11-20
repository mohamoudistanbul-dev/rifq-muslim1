import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Page } from '../components/Shell';
import { AppIcon } from '../components/Icons';
import { useStore } from '../lib/store';
import { get } from '../lib/api';

interface Config {
  downloadUrl: string;
  appName: string;
  tagline: string;
}

export default function Invite() {
  const { t, toast } = useStore();
  const [config, setConfig] = useState<Config | null>(null);
  const [qr, setQr] = useState('');

  useEffect(() => {
    get<Config>('/config')
      .then((res) => {
        setConfig(res);
        return QRCode.toDataURL(res.downloadUrl, { margin: 1, width: 320, color: { dark: '#0b3b2e', light: '#ffffff' } });
      })
      .then((url) => setQr(url))
      .catch(() => setConfig({ downloadUrl: window.location.origin, appName: 'RIFQ Muslim', tagline: 'Your Faith, Your Daily Companion' }));
  }, []);

  const link = config?.downloadUrl || window.location.origin;
  const message = `RIFQ Muslim — ${config?.tagline || 'Your Faith, Your Daily Companion'}\nPrayer times, Quran, Hadith, Qibla and more.\n${link}`;

  const open = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'RIFQ Muslim', text: message, url: link });
        return;
      } catch {
        /* the user cancelled sharing */
      }
    }
    void copy();
  };

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    toast(t('Invitation link copied'), 'success');
  };

  const actions = [
    { label: 'WhatsApp', icon: 'share' as const, run: () => open(`https://wa.me/?text=${encodeURIComponent(message)}`) },
    { label: 'Facebook', icon: 'share' as const, run: () => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`) },
    { label: 'Telegram', icon: 'share' as const, run: () => open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(message)}`) },
    { label: 'SMS', icon: 'chat' as const, run: () => { window.location.href = `sms:?&body=${encodeURIComponent(message)}`; } },
    { label: 'Copy link', icon: 'copy' as const, run: () => void copy() },
    { label: 'More apps', icon: 'share' as const, run: () => void share() },
  ];

  return (
    <Page title="Invite Friends" subtitle={t('Share RIFQ Muslim with your family and friends')}>
      <div className="card center">
        <p className="section-title" style={{ marginTop: 0 }}>{t('Scan to open RIFQ Muslim')}</p>
        {qr ? <img src={qr} alt={t('Invitation QR code')} width={220} height={220} style={{ borderRadius: 12 }} /> : <p className="tiny muted">{t('Generating QR code…')}</p>}
        <p className="tiny muted" style={{ wordBreak: 'break-all', marginBottom: 0 }}>{link}</p>
      </div>

      <div className="grid grid-2">
        {actions.map((a) => (
          <button key={a.label} className="btn btn-soft" onClick={a.run}>
            <AppIcon name={a.icon} size={16} /> {t(a.label)}
          </button>
        ))}
      </div>

      <div className="notice">
        <p className="small" style={{ margin: 0 }}>
          {t('This link is the single official download address configured for RIFQ Muslim. When the Google Play release is published, the administrator can point it at the Play Store listing — it is never hardcoded to a fake address.')}
        </p>
      </div>
    </Page>
  );
}
