import React, { useEffect, useState } from 'react';
import { Page } from '../components/Shell';
import { AppIcon } from '../components/Icons';
import { useStore } from '../lib/store';
import { get, post } from '../lib/api';

interface Config {
  contactEmail: string;
  contactPhone: string;
  whatsapp: string;
  emailConfigured: boolean;
}

export default function Contact() {
  const { t, user, toast } = useStore();
  const [config, setConfig] = useState<Config | null>(null);
  const [form, setForm] = useState({ name: '', email: '', subject: '', body: '' });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ delivered?: boolean; message?: string } | null>(null);

  useEffect(() => {
    get<Config>('/config')
      .then((res) => {
        setConfig(res);
        setForm((f) => ({ ...f, name: user?.name || f.name, email: user?.email || f.email }));
      })
      .catch(() => undefined);
  }, [user]);

  const email = config?.contactEmail || 'mohamoudistanbul@gmail.com';
  const phone = config?.contactPhone || '+252-612215593';
  const whatsapp = (config?.whatsapp || phone).replace(/[^\d]/g, '');

  const submit = async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await post<{ delivered?: boolean; message?: string; note?: string }>('/contact', form);
      setResult(res);
      toast(res.message || res.note || t('Your message has been stored'), 'success');
      setForm((f) => ({ ...f, subject: '', body: '' }));
    } catch (err) {
      toast((err as Error).message || t('The message could not be sent'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(`Email: ${email}\nPhone: ${phone}`);
    toast(t('Contact details copied'), 'success');
  };

  return (
    <Page title="Contact" subtitle={t('Reach the RIFQ Muslim developer')}>
      <div className="card">
        <div className="stack" style={{ gap: 8 }}>
          <a className="btn btn-soft btn-block" href={`mailto:${email}`}>
            <AppIcon name="mail" size={16} /> {email}
          </a>
          <a className="btn btn-soft btn-block" href={`tel:${phone}`}>
            <AppIcon name="phone" size={16} /> {phone}
          </a>
          <a className="btn btn-emerald btn-block" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
            <AppIcon name="chat" size={16} /> WhatsApp
          </a>
          <button className="btn btn-ghost btn-block" onClick={() => void copyAll()}>
            <AppIcon name="copy" size={16} /> {t('Copy details')}
          </button>
        </div>
        <p className="tiny muted" style={{ marginBottom: 0 }}>
          {t('Developer')}: Eng Mohamud Yusuf
        </p>
      </div>

      <div className="card">
        <h3 className="section-title">{t('Send a message')}</h3>
        <div className="field">
          <label>{t('Your name')}</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label>{t('Email')}</label>
          <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="field">
          <label>{t('Subject')}</label>
          <input className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        </div>
        <div className="field">
          <label>{t('Message')}</label>
          <textarea className="textarea" rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        </div>
        <button className="btn btn-primary btn-block" onClick={() => void submit()} disabled={busy}>
          {busy ? t('Sending…') : t('Send message')}
        </button>
        {result && (
          <div className="notice" style={{ marginTop: 10 }}>
            <p className="small" style={{ margin: 0 }}>
              {result.delivered
                ? t('Your message was stored and emailed to the developer.')
                : t('Your message was stored for the developer. Email delivery is not configured on this deployment, so it will be read in the admin dashboard.')}
            </p>
          </div>
        )}
        {config && !config.emailConfigured && (
          <p className="tiny muted" style={{ marginBottom: 0 }}>
            {t('Outgoing email is not configured on this deployment. Messages are stored and visible to the administrator.')}
          </p>
        )}
      </div>
    </Page>
  );
}
