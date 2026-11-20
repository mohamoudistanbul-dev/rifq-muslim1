import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Page, Logo } from '../components/Shell';
import { useStore } from '../lib/store';
import { post } from '../lib/api';
import { LANGS, type Lang } from '../lib/i18n';

function AuthHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="center" style={{ marginBottom: 6 }}>
      <Logo size={64} />
      <h2 className="page-title" style={{ marginBottom: 2 }}>{title}</h2>
      <p className="page-sub" style={{ marginTop: 0 }}>{sub}</p>
    </div>
  );
}

export function Login() {
  const { t, refreshUser, toast } = useStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/';
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await post('/auth/login', form);
      await refreshUser();
      toast(t('Welcome back'), 'success');
      navigate(next, { replace: true });
    } catch (err) {
      toast((err as Error).message || t('Sign in failed'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page title="Sign in">
      <AuthHead title={t('Welcome back')} sub={t('Sign in to sync your worship across devices')} />
      <form className="card" onSubmit={submit}>
        <div className="field">
          <label>{t('Email')}</label>
          <input className="input" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="field">
          <label>{t('Password')}</label>
          <input className="input" type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? t('Signing in…') : t('Sign in')}
        </button>
        <div className="row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
          <Link className="small" to="/forgot">{t('Forgot password?')}</Link>
          <Link className="small" to="/register">{t('Create an account')}</Link>
        </div>
      </form>
    </Page>
  );
}

export function Register() {
  const { t, lang, refreshUser, toast } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast(t('The passwords do not match'), 'error');
    setBusy(true);
    try {
      const res = await post<{ verification?: { sent: boolean; note: string } }>('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        lang,
      });
      await refreshUser();
      setNote(res.verification?.note || '');
      toast(t('Account created'), 'success');
      navigate('/', { replace: true });
    } catch (err) {
      toast((err as Error).message || t('Registration failed'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page title="Create account">
      <AuthHead title={t('Join RIFQ Muslim')} sub={t('Your faith, your daily companion')} />
      <form className="card" onSubmit={submit}>
        <div className="field">
          <label>{t('Name')}</label>
          <input className="input" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label>{t('Email')}</label>
          <input className="input" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="field">
          <label>{t('Password')}</label>
          <input className="input" type="password" autoComplete="new-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <span className="tiny muted">{t('At least 8 characters with a letter and a number.')}</span>
        </div>
        <div className="field">
          <label>{t('Confirm password')}</label>
          <input className="input" type="password" autoComplete="new-password" required value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? t('Creating…') : t('Create account')}
        </button>
        {note && <p className="tiny muted" style={{ marginBottom: 0 }}>{note}</p>}
        <p className="small center" style={{ marginBottom: 0 }}>
          <Link to="/login">{t('I already have an account')}</Link>
        </p>
      </form>
    </Page>
  );
}

export function Forgot() {
  const { t, toast } = useStore();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await post<{ sent: boolean; note: string }>('/auth/forgot', { email });
      setNote(res.note);
    } catch (err) {
      toast((err as Error).message || t('The request failed'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page title="Forgot password">
      <AuthHead title={t('Reset your password')} sub={t('We will email you a secure reset link')} />
      <form className="card" onSubmit={submit}>
        <div className="field">
          <label>{t('Email')}</label>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>{t('Send reset link')}</button>
        {note && <p className="small" style={{ marginBottom: 0 }}>{note}</p>}
        <p className="small center" style={{ marginBottom: 0 }}><Link to="/login">{t('Back to sign in')}</Link></p>
      </form>
    </Page>
  );
}

export function Reset() {
  const { t, refreshUser, toast } = useStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return toast(t('The passwords do not match'), 'error');
    setBusy(true);
    try {
      await post('/auth/reset', { token, password });
      await refreshUser();
      toast(t('Password updated'), 'success');
      navigate('/', { replace: true });
    } catch (err) {
      toast((err as Error).message || t('The reset link is invalid'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page title="New password">
      <AuthHead title={t('Choose a new password')} sub={t('Then you will be signed in automatically')} />
      {!token ? (
        <div className="card center">
          <p className="small">{t('This page needs a valid reset link. Please request a new one.')}</p>
          <Link to="/forgot" className="btn btn-primary btn-block">{t('Request a new link')}</Link>
        </div>
      ) : (
        <form className="card" onSubmit={submit}>
          <div className="field">
            <label>{t('New password')}</label>
            <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="field">
            <label>{t('Confirm password')}</label>
            <input className="input" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>{t('Save new password')}</button>
        </form>
      )}
    </Page>
  );
}

export function Verify() {
  const { t, refreshUser } = useStore();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');

  React.useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('This link has no verification token.');
      return;
    }
    setState('busy');
    post<{ ok?: boolean; message?: string }>('/auth/verify', { token })
      .then(async (res) => {
        await refreshUser();
        setState('ok');
        setMessage(res.message || 'Your email address is verified.');
      })
      .catch((err: Error) => {
        setState('error');
        setMessage(err.message);
      });
  }, [token]);

  return (
    <Page title="Verify email">
      <div className="card center">
        <Logo size={56} />
        <h2 className="page-title">{t('Email verification')}</h2>
        {state === 'busy' && <p className="small">{t('Checking your link…')}</p>}
        {state !== 'busy' && <p className="small">{message}</p>}
        <Link to="/" className="btn btn-primary btn-block">{t('Continue to RIFQ Muslim')}</Link>
      </div>
    </Page>
  );
}
