import React, { useEffect, useState } from 'react';
import { Page, Loading, ErrorBox } from '../components/Shell';
import { AppIcon } from '../components/Icons';
import { useStore } from '../lib/store';
import { get, patch, post, put } from '../lib/api';

type Tab = 'overview' | 'users' | 'messages' | 'reports' | 'posts' | 'broadcast' | 'settings' | 'audit';

interface AdminUser { id: string; name: string; email: string; role: string; banned: boolean; emailVerified: boolean; createdAt: string }
interface Message { id: string; name: string; email: string; phone?: string; subject: string; body: string; status: string; created_at: string }
interface Report { id: string; post_id?: string; post_body?: string; post_author?: string; reason: string; status: string; created_at: string }
interface Post { id: string; author: string; body: string; status: string; likes: number; created_at: string }
interface AuditRow { id: string; action: string; detail: string; email?: string; created_at: string }
interface Overview { [k: string]: number | boolean | string }

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'messages', label: 'Messages' },
  { id: 'reports', label: 'Reports' },
  { id: 'posts', label: 'Posts' },
  { id: 'broadcast', label: 'Notify' },
  { id: 'settings', label: 'Settings' },
  { id: 'audit', label: 'Audit log' },
];

export default function Admin() {
  const { t, user, authReady, toast } = useStore();
  const [tab, setTab] = useState<Tab>('overview');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [broadcast, setBroadcast] = useState({ title: '', body: '' });
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    setError('');
    const jobs: Promise<void>[] = [];
    if (tab === 'overview') jobs.push(get<Overview>('/admin/overview').then(setOverview).catch(() => setError(t('The dashboard could not be loaded.'))));
    if (tab === 'users') jobs.push(get<{ users: AdminUser[] }>(`/admin/users?q=${encodeURIComponent(q)}`).then((r) => setUsers(r.users)).catch(() => setError(t('Users could not be loaded.'))));
    if (tab === 'messages') jobs.push(get<{ messages: Message[] }>('/admin/messages').then((r) => setMessages(r.messages)).catch(() => setError(t('Messages could not be loaded.'))));
    if (tab === 'reports') jobs.push(get<{ reports: Report[] }>('/admin/reports').then((r) => setReports(r.reports)).catch(() => setError(t('Reports could not be loaded.'))));
    if (tab === 'posts') jobs.push(get<{ posts: Post[] }>('/admin/posts').then((r) => setPosts(r.posts)).catch(() => setError(t('Posts could not be loaded.'))));
    if (tab === 'audit') jobs.push(get<{ audit: AuditRow[] }>('/admin/audit').then((r) => setAudit(r.audit)).catch(() => setError(t('The audit log could not be loaded.'))));
    if (tab === 'settings') jobs.push(get<{ settings: Record<string, string> }>('/admin/settings').then((r) => setSettings(r.settings)).catch(() => setError(t('Settings could not be loaded.'))));
    void Promise.all(jobs);
  }, [tab, isAdmin, q]);

  if (!authReady) return <Page title="Admin"><Loading /></Page>;
  if (!isAdmin) {
    return (
      <Page title="Admin">
        <div className="card center">
          <AppIcon name="shield" size={32} />
          <p className="small">{t('This area is restricted to the application administrator. There is no public admin registration.')}</p>
          <p className="tiny muted">{t('Signed in as')}: {user?.email || t('guest')}</p>
        </div>
      </Page>
    );
  }

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      toast(t(ok), 'success');
    } catch (err) {
      toast((err as Error).message || t('The action failed'), 'error');
    }
  };

  return (
    <Page title="Admin" subtitle={`${t('Owner')}: Eng Mohamud Yusuf · ${user.email}`}>
      <div className="chips scroll-x">
        {TABS.map((x) => (
          <button key={x.id} className={`chip ${tab === x.id ? 'active' : ''}`} onClick={() => setTab(x.id)}>{t(x.label)}</button>
        ))}
      </div>

      {error && <ErrorBox message={error} onRetry={() => setTab(tab)} />}

      {tab === 'overview' && (
        !overview ? <Loading /> : (
          <div className="grid grid-2">
            {[
              ['users', 'Users'],
              ['verifiedUsers', 'Verified'],
              ['posts', 'Posts'],
              ['openReports', 'Open reports'],
              ['newMessages', 'New messages'],
              ['bookmarks', 'Bookmarks'],
              ['trackerEntries', 'Tracker entries'],
              ['quizAttempts', 'Quiz attempts'],
              ['broadcasts', 'Notifications'],
            ].map(([key, label]) => (
              <div key={key} className="stat">
                <span className="stat-value">{String(overview[key] ?? 0)}</span>
                <span className="tiny muted">{t(label)}</span>
              </div>
            ))}
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <p className="small" style={{ margin: 0 }}>
                {t('Email delivery')}: <strong>{overview.emailConfigured ? t('configured') : t('not configured')}</strong> · {t('Assistant')}: <strong>{String(overview.assistantMode)}</strong>
              </p>
            </div>
          </div>
        )
      )}

      {tab === 'users' && (
        <>
          <input className="input" placeholder={t('Search by name or email')} value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="stack" style={{ gap: 8, marginTop: 10 }}>
            {users.map((u) => (
              <div key={u.id} className="card">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <strong className="small">{u.name}</strong>
                    <p className="tiny muted" style={{ margin: 0 }}>{u.email}</p>
                  </div>
                  <span className="badge-soft">{u.role}{u.banned ? ` · ${t('suspended')}` : ''}</span>
                </div>
                <div className="row" style={{ gap: 8, marginTop: 8 }}>
                  <button
                    className="btn btn-soft btn-sm"
                    onClick={() => void act(() => patch(`/admin/users/${u.id}`, { role: u.role === 'admin' ? 'user' : 'admin' }), 'Role updated')}
                  >
                    {u.role === 'admin' ? t('Make user') : t('Make admin')}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => void act(() => patch(`/admin/users/${u.id}`, { banned: !u.banned }), 'User updated')}
                  >
                    {u.banned ? t('Restore') : t('Suspend')}
                  </button>
                </div>
              </div>
            ))}
            {users.length === 0 && <p className="empty small">{t('No users match that search.')}</p>}
          </div>
        </>
      )}

      {tab === 'messages' && (
        <div className="stack" style={{ gap: 8 }}>
          {messages.map((m) => (
            <div key={m.id} className="card">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <strong className="small">{m.subject || t('No subject')}</strong>
                <span className="badge-soft">{m.status}</span>
              </div>
              <p className="tiny muted" style={{ margin: '4px 0' }}>{m.name} · {m.email}{m.phone ? ` · ${m.phone}` : ''} · {new Date(m.created_at).toLocaleString()}</p>
              <p className="small" style={{ whiteSpace: 'pre-wrap' }}>{m.body}</p>
              <div className="row" style={{ gap: 8 }}>
                <a className="btn btn-soft btn-sm" href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject || 'RIFQ Muslim')}`}>{t('Reply')}</a>
                <button className="btn btn-ghost btn-sm" onClick={() => void act(() => patch(`/admin/messages/${m.id}`, { status: 'archived' }), 'Message archived')}>{t('Archive')}</button>
              </div>
            </div>
          ))}
          {messages.length === 0 && <p className="empty small">{t('No messages yet.')}</p>}
        </div>
      )}

      {tab === 'reports' && (
        <div className="stack" style={{ gap: 8 }}>
          {reports.map((r) => (
            <div key={r.id} className="card">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <strong className="small">{t('Report')} · {r.post_author || t('unknown member')}</strong>
                <span className="badge-soft">{r.status}</span>
              </div>
              <p className="tiny muted" style={{ margin: '4px 0' }}>{r.reason}</p>
              <p className="small" style={{ background: 'var(--cream-soft)', padding: 8, borderRadius: 8 }}>{r.post_body}</p>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn btn-soft btn-sm" onClick={() => void act(() => patch(`/admin/reports/${r.id}`, { status: 'resolved', hidePost: true, postId: r.post_id }), 'Report resolved and post hidden')}>{t('Hide post')}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => void act(() => patch(`/admin/reports/${r.id}`, { status: 'dismissed' }), 'Report dismissed')}>{t('Dismiss')}</button>
              </div>
            </div>
          ))}
          {reports.length === 0 && <p className="empty small">{t('No reports waiting.')}</p>}
        </div>
      )}

      {tab === 'posts' && (
        <div className="stack" style={{ gap: 8 }}>
          {posts.map((p) => (
            <div key={p.id} className="card">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <strong className="small">{p.author}</strong>
                <span className="badge-soft">{p.status}</span>
              </div>
              <p className="small">{p.body}</p>
              <button className="btn btn-ghost btn-sm" onClick={() => void act(() => patch(`/admin/posts/${p.id}`, { status: p.status === 'hidden' ? 'published' : 'hidden' }), 'Post updated')}>
                {p.status === 'hidden' ? t('Publish') : t('Hide')}
              </button>
            </div>
          ))}
          {posts.length === 0 && <p className="empty small">{t('No posts yet.')}</p>}
        </div>
      )}

      {tab === 'broadcast' && (
        <div className="card">
          <h3 className="section-title">{t('Send a notification to all users')}</h3>
          <div className="field">
            <label>{t('Title')}</label>
            <input className="input" maxLength={120} value={broadcast.title} onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })} />
          </div>
          <div className="field">
            <label>{t('Message')}</label>
            <textarea className="textarea" rows={4} maxLength={1000} value={broadcast.body} onChange={(e) => setBroadcast({ ...broadcast, body: e.target.value })} />
          </div>
          <button
            className="btn btn-primary btn-block"
            onClick={() => void act(async () => {
              await post('/admin/broadcast', broadcast);
              setBroadcast({ title: '', body: '' });
            }, 'Notification published')}
          >
            {t('Publish notification')}
          </button>
          <p className="tiny muted" style={{ marginBottom: 0 }}>{t('Published notifications appear in the app home banner.')}</p>
        </div>
      )}

      {tab === 'settings' && (
        <div className="card">
          <h3 className="section-title">{t('Application settings')}</h3>
          {[
            ['contact_email', 'Contact email'],
            ['contact_phone', 'Contact phone'],
            ['whatsapp', 'WhatsApp number'],
            ['download_url', 'Official download URL'],
          ].map(([key, label]) => (
            <div className="field" key={key}>
              <label>{t(label)}</label>
              <input className="input" value={settings[key] || ''} onChange={(e) => setSettings({ ...settings, [key]: e.target.value })} />
            </div>
          ))}
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="small">{t('Community enabled')}</span>
            <button
              className={`switch ${settings.community_enabled === 'true' ? 'on' : ''}`}
              onClick={() => setSettings({ ...settings, community_enabled: settings.community_enabled === 'true' ? 'false' : 'true' })}
              aria-label={t('Toggle community')}
            />
          </div>
          <button
            className="btn btn-primary btn-block"
            style={{ marginTop: 12 }}
            onClick={() => void act(async () => {
              await put('/admin/settings', settings);
              setSettings({ ...settings });
            }, 'Settings saved')}
          >
            {t('Save settings')}
          </button>
        </div>
      )}

      {tab === 'audit' && (
        <div className="card">
          <table className="table">
            <thead>
              <tr><th>{t('When')}</th><th>{t('Action')}</th><th>{t('Detail')}</th></tr>
            </thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.id}>
                  <td className="tiny">{new Date(a.created_at).toLocaleString()}</td>
                  <td className="tiny">{a.action}</td>
                  <td className="tiny muted">{a.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {audit.length === 0 && <p className="empty small">{t('No activity recorded yet.')}</p>}
        </div>
      )}
    </Page>
  );
}
