import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Page, Loading, ErrorBox, Modal } from '../components/Shell';
import { AppIcon } from '../components/Icons';
import { useStore } from '../lib/store';
import { get, post } from '../lib/api';

interface Post {
  id: string;
  author: string;
  user_id: string;
  body: string;
  likes: number;
  created_at: string;
}

export default function Community() {
  const { t, user, toast } = useStore();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [reportFor, setReportFor] = useState<Post | null>(null);
  const [reason, setReason] = useState('');

  const load = () => {
    setError('');
    get<{ posts: Post[]; disabled: boolean }>('/community/posts')
      .then((res) => {
        setPosts(res.posts);
        setDisabled(res.disabled);
      })
      .catch(() => setError(t('The community feed could not be loaded.')));
  };

  useEffect(load, [user]);

  const publish = async () => {
    if (!user) return toast(t('Sign in to post'), 'error');
    if (text.trim().length < 8) return toast(t('Please write a little more before posting'), 'error');
    setBusy(true);
    try {
      await post('/community/posts', { body: text.trim() });
      setText('');
      toast(t('Your post is published'), 'success');
      load();
    } catch (err) {
      toast((err as Error).message || t('The post could not be published'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const like = async (p: Post) => {
    if (!user) return toast(t('Sign in to react'), 'error');
    try {
      const res = await post<{ likes: number; liked: boolean }>(`/community/posts/${p.id}/like`);
      setPosts((list) => (list || []).map((x) => (x.id === p.id ? { ...x, likes: res.likes } : x)));
    } catch {
      toast(t('That reaction could not be saved'), 'error');
    }
  };

  const block = async (p: Post) => {
    try {
      await post('/community/block', { userId: p.user_id });
      setPosts((list) => (list || []).filter((x) => x.user_id !== p.user_id));
      toast(t('You will no longer see posts from this member'), 'success');
    } catch {
      toast(t('The block could not be saved'), 'error');
    }
  };

  const sendReport = async () => {
    if (!reportFor) return;
    if (reason.trim().length < 4) return toast(t('Please describe the problem briefly'), 'error');
    try {
      const res = await post<{ note: string }>('/community/report', { postId: reportFor.id, reason: reason.trim() });
      toast(res.note || t('Report sent to the moderators'), 'success');
      setReportFor(null);
      setReason('');
    } catch (err) {
      toast((err as Error).message || t('The report could not be sent'), 'error');
    }
  };

  return (
    <Page title="Community" subtitle={t('Moderated discussion among Muslims')}>
      {disabled && (
        <div className="notice">
          <p className="small" style={{ margin: 0 }}>{t('The community area is currently closed by the administrator.')}</p>
        </div>
      )}

      <div className="card">
        <h3 className="section-title">{t('Community guidelines')}</h3>
        <ul className="small" style={{ margin: 0, paddingInlineStart: 18, lineHeight: 1.7 }}>
          <li>{t('Speak with adab. No insults, sectarian attacks or harassment.')}</li>
          <li>{t('No personal data about yourself or others; no phone numbers or addresses.')}</li>
          <li>{t('No spam, advertising or political campaigning.')}</li>
          <li>{t('Posts are filtered automatically and reviewed by moderators; reports are logged.')}</li>
        </ul>
      </div>

      {user ? (
        <div className="card">
          <textarea
            className="textarea"
            rows={3}
            maxLength={1200}
            placeholder={t('Share a benefit, a reminder or a question…')}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="row" style={{ justifyContent: 'space-between', marginTop: 8 }}>
            <span className="tiny muted">{text.length}/1200</span>
            <button className="btn btn-primary btn-sm" onClick={() => void publish()} disabled={busy}>
              {t('Publish')}
            </button>
          </div>
        </div>
      ) : (
        <div className="card center">
          <p className="small">{t('Sign in to read with reactions, post and report content.')}</p>
          <Link to="/login" className="btn btn-primary btn-block">{t('Sign in')}</Link>
        </div>
      )}

      {error && <ErrorBox message={error} onRetry={load} />}
      {!posts && !error && <Loading />}

      <div className="stack" style={{ gap: 10 }}>
        {(posts || []).map((p) => (
          <article key={p.id} className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="small"><strong>{p.author}</strong></span>
              <span className="tiny muted">{new Date(p.created_at).toLocaleString()}</span>
            </div>
            <p className="small" style={{ margin: '8px 0', whiteSpace: 'pre-wrap' }}>{p.body}</p>
            <div className="ayah-actions">
              <button className="icon-btn" onClick={() => void like(p)} aria-label={t('Like')}>
                <AppIcon name="heart" size={16} /> <span className="tiny">{p.likes}</span>
              </button>
              <button className="icon-btn" onClick={() => setReportFor(p)} aria-label={t('Report')}>
                <AppIcon name="shield" size={16} />
              </button>
              {user && p.user_id !== user.id && (
                <button className="btn btn-ghost btn-sm" onClick={() => void block(p)}>{t('Block')}</button>
              )}
            </div>
          </article>
        ))}
        {posts && posts.length === 0 && !disabled && (
          <div className="empty">
            <p className="small">{t('No posts yet. Be the first to share a benefit.')}</p>
          </div>
        )}
      </div>

      <Modal open={Boolean(reportFor)} title={t('Report this post')} onClose={() => setReportFor(null)}>
        <p className="tiny muted">{reportFor?.body.slice(0, 140)}…</p>
        <textarea
          className="textarea"
          rows={3}
          placeholder={t('What is the problem?')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <button className="btn btn-primary btn-block" style={{ marginTop: 10 }} onClick={() => void sendReport()}>
          {t('Send report')}
        </button>
      </Modal>
    </Page>
  );
}
