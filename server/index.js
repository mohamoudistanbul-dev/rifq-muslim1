import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db, newId, nowIso, auditLog, publicUser, getSetting, setSetting } from './db.js';
import {
  attachUser,
  requireAuth,
  requireAdmin,
  signSession,
  verifyPassword,
  hashPassword,
  emailOk,
  passwordProblem,
  token,
  rateLimit,
  COOKIE,
  cookieOptions,
} from './auth.js';
import { sendEmail, mailConfigured } from './mail.js';
import { answerQuestion } from './assistant.js';
import { contentRouter, warmContent } from './content.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3000);
const OWNER_EMAIL = (process.env.ADMIN_EMAIL || 'mohamoudistanbul@gmail.com').toLowerCase();

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '256kb' }));

// Cookie parsing without an extra dependency.
app.use((req, _res, next) => {
  const raw = req.headers.cookie || '';
  req.cookies = {};
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) {
      const k = part.slice(0, i).trim();
      const v = part.slice(i + 1).trim();
      try {
        req.cookies[k] = decodeURIComponent(v);
      } catch {
        req.cookies[k] = v;
      }
    }
  }
  next();
});
app.use(attachUser);

const originOf = (req) => {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  return process.env.PUBLIC_URL || `${proto}://${req.get('host')}`;
};

// Promote the configured owner account on boot.
db.prepare("UPDATE users SET role = 'admin' WHERE lower(email) = ?").run(OWNER_EMAIL);

/* ---------------------------------- config --------------------------------- */

app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'RIFQ Muslim', time: nowIso() }));

app.get('/api/config', (req, res) => {
  res.json({
    appName: 'RIFQ Muslim',
    tagline: 'Your Faith, Your Daily Companion',
    developer: 'Made by Eng Mohamud Yusuf',
    contactEmail: getSetting('contact_email', 'mohamoudistanbul@gmail.com'),
    contactPhone: getSetting('contact_phone', '+252-612215593'),
    whatsapp: getSetting('whatsapp', '+252612215593'),
    downloadUrl: getSetting('download_url', '') || originOf(req),
    communityEnabled: getSetting('community_enabled', 'true') === 'true',
    emailConfigured: mailConfigured(),
    assistantMode: process.env.OPENAI_API_KEY ? 'model' : 'knowledge-base',
    ownerEmail: OWNER_EMAIL,
  });
});

app.get('/api/notices', (req, res) => {
  const rows = db.prepare('SELECT id, title, body, created_at FROM broadcasts ORDER BY created_at DESC LIMIT 5').all();
  res.json({ notices: rows });
});

/* ----------------------------------- auth ---------------------------------- */

app.post('/api/auth/register', rateLimit({ windowMs: 60_000, max: 8 }), async (req, res) => {
  const name = String(req.body?.name || '').trim().slice(0, 80);
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const lang = ['en', 'ar', 'so'].includes(req.body?.lang) ? req.body.lang : 'en';

  if (name.length < 2) return res.status(400).json({ error: 'Please enter your name.' });
  if (!emailOk(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  const pwProblem = passwordProblem(password);
  if (pwProblem) return res.status(400).json({ error: pwProblem });

  const existing = db.prepare('SELECT id FROM users WHERE lower(email) = ?').get(email);
  if (existing) return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });

  const id = newId();
  const verifyToken = token();
  const role = email === OWNER_EMAIL ? 'admin' : 'user';
  db.prepare(
    `INSERT INTO users (id, email, name, pass_hash, role, verified, verify_token, lang, created_at)
     VALUES (?,?,?,?,?,?,?,?,?)`
  ).run(id, email, name, hashPassword(password), role, 0, verifyToken, lang, nowIso());

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  const link = `${originOf(req)}/verify?token=${verifyToken}`;
  const delivery = await sendEmail({
    to: email,
    subject: 'Verify your RIFQ Muslim account',
    text: `Assalamu alaikum ${name},\n\nWelcome to RIFQ Muslim. Confirm your email address:\n${link}\n\nIf you did not create this account, ignore this email.`,
  });
  auditLog(user, 'register', `role=${role}`);

  res.cookie(COOKIE, signSession(user), cookieOptions(req));
  res.status(201).json({
    user: publicUser(user),
    verification: delivery.delivered
      ? { sent: true, note: 'A verification email is on its way.' }
      : { sent: false, note: delivery.reason },
  });
});

app.post('/api/auth/login', rateLimit({ windowMs: 60_000, max: 12 }), (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const user = db.prepare('SELECT * FROM users WHERE lower(email) = ?').get(email);
  if (!user || !verifyPassword(password, user.pass_hash)) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }
  if (user.banned) return res.status(403).json({ error: 'This account has been suspended. Please contact support.' });
  db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(nowIso(), user.id);
  auditLog(user, 'login');
  res.cookie(COOKIE, signSession(user), cookieOptions(req));
  res.json({ user: publicUser(user) });
});

app.post('/api/auth/logout', (req, res) => {
  const opts = cookieOptions(req);
  res.clearCookie(COOKIE, { ...opts, maxAge: undefined });
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.user) return res.json({ user: null });
  res.json({ user: publicUser(req.user) });
});

app.patch('/api/auth/profile', requireAuth, (req, res) => {
  const name = req.body?.name !== undefined ? String(req.body.name).trim().slice(0, 80) : req.user.name;
  const lang = ['en', 'ar', 'so'].includes(req.body?.lang) ? req.body.lang : req.user.lang;
  const theme = ['light', 'dark'].includes(req.body?.theme) ? req.body.theme : req.user.theme;
  if (name.length < 2) return res.status(400).json({ error: 'Please enter your name.' });

  let prefs = {};
  try {
    prefs = JSON.parse(req.user.prefs || '{}');
  } catch {
    prefs = {};
  }
  if (req.body?.prefs && typeof req.body.prefs === 'object') {
    prefs = { ...prefs, ...req.body.prefs };
  }
  db.prepare('UPDATE users SET name = ?, lang = ?, theme = ?, prefs = ? WHERE id = ?').run(
    name,
    lang,
    theme,
    JSON.stringify(prefs).slice(0, 8000),
    req.user.id
  );
  auditLog(req.user, 'profile.update');
  res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) });
});

app.post('/api/auth/password', requireAuth, (req, res) => {
  const current = String(req.body?.currentPassword || '');
  const next = String(req.body?.newPassword || '');
  if (!verifyPassword(current, req.user.pass_hash)) return res.status(400).json({ error: 'Current password is incorrect.' });
  const problem = passwordProblem(next);
  if (problem) return res.status(400).json({ error: problem });
  db.prepare('UPDATE users SET pass_hash = ?, token_version = token_version + 1 WHERE id = ?').run(
    hashPassword(next),
    req.user.id
  );
  const fresh = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.cookie(COOKIE, signSession(fresh), cookieOptions(req));
  auditLog(req.user, 'password.change');
  res.json({ ok: true });
});

app.post('/api/auth/forgot', rateLimit({ windowMs: 60_000, max: 6 }), async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const user = emailOk(email) ? db.prepare('SELECT * FROM users WHERE lower(email) = ?').get(email) : null;
  let delivery = { delivered: false, reason: 'Email delivery is not configured yet.' };
  if (user) {
    const resetToken = token();
    db.prepare('UPDATE users SET reset_token = ?, reset_exp = ? WHERE id = ?').run(
      resetToken,
      Date.now() + 1000 * 60 * 60,
      user.id
    );
    const link = `${originOf(req)}/reset?token=${resetToken}`;
    delivery = await sendEmail({
      to: user.email,
      subject: 'Reset your RIFQ Muslim password',
      text: `Assalamu alaikum,\n\nReset your password using this link (valid 1 hour):\n${link}\n\nIf you did not request this, ignore this email.`,
    });
    auditLog(user, 'password.forgot');
  }
  res.json({
    ok: true,
    sent: delivery.delivered,
    note: delivery.delivered
      ? 'If that email is registered, reset instructions have been sent.'
      : `If that email is registered, a reset link was created, but email delivery is unavailable: ${delivery.reason}`,
  });
});

app.post('/api/auth/reset', rateLimit({ windowMs: 60_000, max: 8 }), (req, res) => {
  const resetToken = String(req.body?.token || '');
  const password = String(req.body?.password || '');
  const problem = passwordProblem(password);
  if (problem) return res.status(400).json({ error: problem });
  const user = db.prepare('SELECT * FROM users WHERE reset_token = ?').get(resetToken);
  if (!user || !user.reset_exp || Number(user.reset_exp) < Date.now()) {
    return res.status(400).json({ error: 'This reset link is invalid or has expired. Please request a new one.' });
  }
  db.prepare(
    'UPDATE users SET pass_hash = ?, reset_token = NULL, reset_exp = NULL, token_version = token_version + 1 WHERE id = ?'
  ).run(hashPassword(password), user.id);
  auditLog(user, 'password.reset');
  const fresh = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  res.cookie(COOKIE, signSession(fresh), cookieOptions(req));
  res.json({ ok: true, user: publicUser(fresh) });
});

app.post('/api/auth/verify', (req, res) => {
  const verifyToken = String(req.body?.token || '');
  const user = db.prepare('SELECT * FROM users WHERE verify_token = ?').get(verifyToken);
  if (!user) return res.status(400).json({ error: 'This verification link is invalid or already used.' });
  db.prepare('UPDATE users SET verified = 1, verify_token = NULL WHERE id = ?').run(user.id);
  auditLog(user, 'email.verify');
  res.json({ ok: true });
});

app.post('/api/auth/resend-verification', requireAuth, async (req, res) => {
  if (req.user.verified) return res.json({ sent: false, note: 'Your email is already verified.' });
  const verifyToken = req.user.verify_token || token();
  db.prepare('UPDATE users SET verify_token = ? WHERE id = ?').run(verifyToken, req.user.id);
  const delivery = await sendEmail({
    to: req.user.email,
    subject: 'Verify your RIFQ Muslim account',
    text: `Confirm your email address: ${originOf(req)}/verify?token=${verifyToken}`,
  });
  res.json({ sent: delivery.delivered, note: delivery.delivered ? 'Verification email sent.' : delivery.reason });
});

app.delete('/api/auth/account', requireAuth, (req, res) => {
  const id = req.user.id;
  for (const table of ['bookmarks', 'tasbih', 'tracker', 'quiz_results', 'posts', 'blocks', 'post_likes']) {
    try {
      const col = table === 'blocks' || table === 'post_likes' ? 'user_id' : 'user_id';
      db.prepare(`DELETE FROM ${table} WHERE ${col} = ?`).run(id);
    } catch {
      /* table without user_id */
    }
  }
  db.prepare('DELETE FROM reports WHERE reporter_id = ?').run(id);
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  auditLog({ id, email: req.user.email }, 'account.delete');
  res.clearCookie(COOKIE, { ...cookieOptions(req), maxAge: undefined });
  res.json({ ok: true });
});

/* -------------------------------- bookmarks -------------------------------- */

app.get('/api/bookmarks', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json({ bookmarks: rows });
});

app.post('/api/bookmarks', requireAuth, (req, res) => {
  const kind = String(req.body?.kind || '').slice(0, 20);
  const ref = String(req.body?.ref || '').slice(0, 120);
  if (!kind || !ref) return res.status(400).json({ error: 'Missing bookmark reference.' });
  const existing = db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND kind = ? AND ref = ?').get(
    req.user.id,
    kind,
    ref
  );
  if (existing) {
    db.prepare('DELETE FROM bookmarks WHERE id = ?').run(existing.id);
    return res.json({ removed: true });
  }
  const id = newId();
  db.prepare(
    'INSERT INTO bookmarks (id, user_id, kind, ref, surah, ayah, label, note, created_at) VALUES (?,?,?,?,?,?,?,?,?)'
  ).run(
    id,
    req.user.id,
    kind,
    ref,
    req.body?.surah ?? null,
    req.body?.ayah ?? null,
    String(req.body?.label || '').slice(0, 200),
    String(req.body?.note || '').slice(0, 500),
    nowIso()
  );
  res.status(201).json({ bookmark: db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(id) });
});

app.delete('/api/bookmarks/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM bookmarks WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

/* ---------------------------------- tasbih --------------------------------- */

app.get('/api/tasbih', requireAuth, (req, res) => {
  const day = String(req.query.day || new Date().toISOString().slice(0, 10));
  const rows = db.prepare('SELECT * FROM tasbih WHERE user_id = ? AND day = ?').all(req.user.id, day);
  const totals = db
    .prepare('SELECT day, SUM(count) AS total FROM tasbih WHERE user_id = ? GROUP BY day ORDER BY day DESC LIMIT 30')
    .all(req.user.id);
  res.json({ day, entries: rows, totals });
});

app.post('/api/tasbih', requireAuth, (req, res) => {
  const dhikr = String(req.body?.dhikr || '').slice(0, 200) || 'SubhanAllah';
  const count = Math.max(0, Math.min(1_000_000, Number(req.body?.count) || 0));
  const target = Math.max(1, Math.min(100_000, Number(req.body?.target) || 33));
  const day = String(req.body?.day || new Date().toISOString().slice(0, 10));
  db.prepare(
    `INSERT INTO tasbih (id, user_id, dhikr, count, target, day, updated_at) VALUES (?,?,?,?,?,?,?)
     ON CONFLICT(user_id, dhikr, day) DO UPDATE SET count = excluded.count, target = excluded.target, updated_at = excluded.updated_at`
  ).run(newId(), req.user.id, dhikr, count, target, day, nowIso());
  res.json({ ok: true });
});

/* --------------------------------- tracker --------------------------------- */

app.get('/api/tracker', requireAuth, (req, res) => {
  const day = String(req.query.day || new Date().toISOString().slice(0, 10));
  const row = db.prepare('SELECT * FROM tracker WHERE user_id = ? AND day = ?').get(req.user.id, day);
  const recent = db.prepare('SELECT * FROM tracker WHERE user_id = ? ORDER BY day DESC LIMIT 30').all(req.user.id);
  res.json({ day, entry: row || null, recent });
});

app.put('/api/tracker', requireAuth, (req, res) => {
  const day = String(req.body?.day || new Date().toISOString().slice(0, 10)).slice(0, 10);
  const prayers = JSON.stringify(req.body?.prayers || {});
  const deeds = JSON.stringify(req.body?.deeds || {});
  const quranPages = Math.max(0, Math.min(1000, Number(req.body?.quranPages) || 0));
  const dhikr = Math.max(0, Math.min(100000, Number(req.body?.dhikr) || 0));
  const fasting = req.body?.fasting ? 1 : 0;
  db.prepare(
    `INSERT INTO tracker (id, user_id, day, prayers, quran_pages, dhikr, fasting, deeds) VALUES (?,?,?,?,?,?,?,?)
     ON CONFLICT(user_id, day) DO UPDATE SET prayers = excluded.prayers, quran_pages = excluded.quran_pages,
       dhikr = excluded.dhikr, fasting = excluded.fasting, deeds = excluded.deeds`
  ).run(newId(), req.user.id, day, prayers, quranPages, dhikr, fasting, deeds);
  res.json({ ok: true });
});

app.post('/api/quiz/results', requireAuth, (req, res) => {
  const category = String(req.body?.category || 'general').slice(0, 40);
  const score = Math.max(0, Math.min(200, Number(req.body?.score) || 0));
  const total = Math.max(1, Math.min(200, Number(req.body?.total) || 1));
  db.prepare('INSERT INTO quiz_results (id, user_id, category, score, total, created_at) VALUES (?,?,?,?,?,?)').run(
    newId(),
    req.user.id,
    category,
    score,
    total,
    nowIso()
  );
  res.status(201).json({ ok: true });
});

app.get('/api/quiz/results', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM quiz_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 50')
    .all(req.user.id);
  res.json({ results: rows });
});

/* -------------------------------- community -------------------------------- */

const bannedWords = ['kafir scum', 'kill', 'idiot', 'stupid fool'];

app.get('/api/community/posts', (req, res) => {
  if (getSetting('community_enabled', 'true') !== 'true') {
    return res.json({ posts: [], disabled: true });
  }
  const blocked = req.user
    ? db.prepare('SELECT blocked_user_id FROM blocks WHERE user_id = ?').all(req.user.id).map((r) => r.blocked_user_id)
    : [];
  const rows = db
    .prepare("SELECT * FROM posts WHERE status = 'published' ORDER BY created_at DESC LIMIT 60")
    .all()
    .filter((p) => !blocked.includes(p.user_id));
  res.json({ posts: rows, disabled: false });
});

app.post('/api/community/posts', requireAuth, rateLimit({ windowMs: 60_000, max: 5 }), (req, res) => {
  if (getSetting('community_enabled', 'true') !== 'true') {
    return res.status(403).json({ error: 'The community area is currently closed by the administrator.' });
  }
  const body = String(req.body?.body || '').trim().slice(0, 1200);
  if (body.length < 8) return res.status(400).json({ error: 'Please write a little more before posting.' });
  const lower = body.toLowerCase();
  if (bannedWords.some((w) => lower.includes(w))) {
    return res.status(400).json({ error: 'This post was blocked by the community guidelines filter.' });
  }
  const links = (body.match(/https?:\/\//g) || []).length;
  if (links > 1) return res.status(400).json({ error: 'Please keep posts free of link spam.' });
  const id = newId();
  db.prepare('INSERT INTO posts (id, user_id, author, body, created_at) VALUES (?,?,?,?,?)').run(
    id,
    req.user.id,
    req.user.name || 'Muslim',
    body,
    nowIso()
  );
  auditLog(req.user, 'post.create', id);
  res.status(201).json({ post: db.prepare('SELECT * FROM posts WHERE id = ?').get(id) });
});

app.post('/api/community/posts/:id/like', requireAuth, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found.' });
  const liked = db.prepare('SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?').get(post.id, req.user.id);
  if (liked) {
    db.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?').run(post.id, req.user.id);
    db.prepare('UPDATE posts SET likes = MAX(likes - 1, 0) WHERE id = ?').run(post.id);
  } else {
    db.prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?,?)').run(post.id, req.user.id);
    db.prepare('UPDATE posts SET likes = likes + 1 WHERE id = ?').run(post.id);
  }
  res.json({ likes: db.prepare('SELECT likes FROM posts WHERE id = ?').get(post.id).likes, liked: !liked });
});

app.post('/api/community/report', requireAuth, rateLimit({ windowMs: 60_000, max: 10 }), (req, res) => {
  const reason = String(req.body?.reason || '').trim().slice(0, 500);
  if (reason.length < 4) return res.status(400).json({ error: 'Please describe the problem briefly.' });
  db.prepare('INSERT INTO reports (id, post_id, reporter_id, reporter_email, reason, created_at) VALUES (?,?,?,?,?,?)').run(
    newId(),
    String(req.body?.postId || '').slice(0, 60),
    req.user.id,
    req.user.email,
    reason,
    nowIso()
  );
  auditLog(req.user, 'post.report');
  res.status(201).json({ ok: true, note: 'Thank you. A moderator will review this report.' });
});

app.post('/api/community/block', requireAuth, (req, res) => {
  const target = String(req.body?.userId || '').slice(0, 60);
  if (!target || target === req.user.id) return res.status(400).json({ error: 'Invalid user.' });
  db.prepare('INSERT OR IGNORE INTO blocks (user_id, blocked_user_id) VALUES (?,?)').run(req.user.id, target);
  res.json({ ok: true });
});

/* --------------------------------- contact --------------------------------- */

app.post('/api/contact', rateLimit({ windowMs: 60_000, max: 5 }), async (req, res) => {
  const name = String(req.body?.name || '').trim().slice(0, 80);
  const email = String(req.body?.email || '').trim().slice(0, 120);
  const phone = String(req.body?.phone || '').trim().slice(0, 40);
  const subject = String(req.body?.subject || '').trim().slice(0, 140);
  const body = String(req.body?.body || '').trim().slice(0, 4000);
  if (name.length < 2) return res.status(400).json({ error: 'Please enter your name.' });
  if (!emailOk(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (body.length < 10) return res.status(400).json({ error: 'Please write a little more in your message.' });

  const id = newId();
  const owner = getSetting('contact_email', 'mohamoudistanbul@gmail.com');
  const delivery = await sendEmail({
    to: owner,
    subject: `RIFQ Muslim contact: ${subject || 'New message'}`,
    text: `From: ${name} <${email}>${phone ? `\nPhone: ${phone}` : ''}\n\n${body}`,
  });
  db.prepare(
    'INSERT INTO messages (id, user_id, name, email, phone, subject, body, created_at, email_delivered, email_note) VALUES (?,?,?,?,?,?,?,?,?,?)'
  ).run(id, req.user?.id || null, name, email, phone, subject, body, nowIso(), delivery.delivered ? 1 : 0, delivery.reason || '');
  auditLog(req.user, 'contact.message', id);
  res.status(201).json({
    stored: true,
    delivered: delivery.delivered,
    note: delivery.delivered
      ? 'Your message was saved and emailed to the RIFQ Muslim team.'
      : `Your message is saved in the RIFQ Muslim inbox, but email delivery is not configured yet (${delivery.reason}). The team will see it in the admin dashboard.`,
  });
});

/* -------------------------------- assistant -------------------------------- */

app.post('/api/assistant', rateLimit({ windowMs: 60_000, max: 12 }), async (req, res) => {
  const result = await answerQuestion({
    question: req.body?.question,
    lang: req.body?.lang,
    history: Array.isArray(req.body?.history) ? req.body.history : [],
  });
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
});

/* ------------------------- Quran / hadith / places -------------------------- */

app.use('/api', contentRouter);

/* ---------------------------------- admin ---------------------------------- */

app.get('/api/admin/overview', requireAdmin, (_req, res) => {
  const one = (sql) => db.prepare(sql).get().c;
  res.json({
    users: one('SELECT COUNT(*) AS c FROM users'),
    verifiedUsers: one('SELECT COUNT(*) AS c FROM users WHERE verified = 1'),
    admins: one("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'"),
    posts: one('SELECT COUNT(*) AS c FROM posts'),
    openReports: one("SELECT COUNT(*) AS c FROM reports WHERE status = 'open'"),
    newMessages: one("SELECT COUNT(*) AS c FROM messages WHERE status = 'new'"),
    bookmarks: one('SELECT COUNT(*) AS c FROM bookmarks'),
    trackerEntries: one('SELECT COUNT(*) AS c FROM tracker'),
    quizAttempts: one('SELECT COUNT(*) AS c FROM quiz_results'),
    broadcasts: one('SELECT COUNT(*) AS c FROM broadcasts'),
    emailConfigured: mailConfigured(),
    assistantMode: process.env.OPENAI_API_KEY ? 'model' : 'knowledge-base',
  });
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
  const q = `%${String(req.query.q || '').toLowerCase()}%`;
  const rows = db
    .prepare('SELECT * FROM users WHERE lower(email) LIKE ? OR lower(name) LIKE ? ORDER BY created_at DESC LIMIT 200')
    .all(q, q);
  res.json({
    users: rows.map((u) => ({ ...publicUser(u), banned: !!u.banned })),
  });
});

app.patch('/api/admin/users/:id', requireAdmin, (req, res) => {
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found.' });
  if (target.email.toLowerCase() === OWNER_EMAIL && req.body?.role === 'user') {
    return res.status(400).json({ error: 'The owner account cannot be demoted.' });
  }
  const role = ['user', 'admin'].includes(req.body?.role) ? req.body.role : target.role;
  const banned = req.body?.banned === undefined ? target.banned : req.body.banned ? 1 : 0;
  db.prepare('UPDATE users SET role = ?, banned = ?, token_version = token_version + 1 WHERE id = ?').run(
    role,
    banned,
    target.id
  );
  auditLog(req.user, 'admin.user.update', `${target.email} role=${role} banned=${banned}`);
  res.json({ ok: true });
});

app.get('/api/admin/messages', requireAdmin, (_req, res) => {
  res.json({ messages: db.prepare('SELECT * FROM messages ORDER BY created_at DESC LIMIT 200').all() });
});

app.patch('/api/admin/messages/:id', requireAdmin, (req, res) => {
  const status = ['new', 'read', 'replied', 'archived'].includes(req.body?.status) ? req.body.status : 'read';
  db.prepare('UPDATE messages SET status = ? WHERE id = ?').run(status, req.params.id);
  auditLog(req.user, 'admin.message.update', `${req.params.id} ${status}`);
  res.json({ ok: true });
});

app.get('/api/admin/reports', requireAdmin, (_req, res) => {
  const rows = db
    .prepare(
      `SELECT r.*, p.body AS post_body, p.author AS post_author FROM reports r
       LEFT JOIN posts p ON p.id = r.post_id ORDER BY r.created_at DESC LIMIT 200`
    )
    .all();
  res.json({ reports: rows });
});

app.patch('/api/admin/reports/:id', requireAdmin, (req, res) => {
  const status = ['open', 'resolved', 'dismissed'].includes(req.body?.status) ? req.body.status : 'resolved';
  db.prepare('UPDATE reports SET status = ? WHERE id = ?').run(status, req.params.id);
  if (req.body?.hidePost && req.body?.postId) {
    db.prepare("UPDATE posts SET status = 'hidden' WHERE id = ?").run(req.body.postId);
  }
  auditLog(req.user, 'admin.report.update', `${req.params.id} ${status}`);
  res.json({ ok: true });
});

app.get('/api/admin/posts', requireAdmin, (_req, res) => {
  res.json({ posts: db.prepare('SELECT * FROM posts ORDER BY created_at DESC LIMIT 200').all() });
});

app.patch('/api/admin/posts/:id', requireAdmin, (req, res) => {
  const status = ['published', 'hidden'].includes(req.body?.status) ? req.body.status : 'published';
  db.prepare('UPDATE posts SET status = ? WHERE id = ?').run(status, req.params.id);
  auditLog(req.user, 'admin.post.moderate', `${req.params.id} ${status}`);
  res.json({ ok: true });
});

app.get('/api/admin/audit', requireAdmin, (_req, res) => {
  res.json({ audit: db.prepare('SELECT * FROM audit ORDER BY created_at DESC LIMIT 200').all() });
});

app.get('/api/admin/resets', requireAdmin, (_req, res) => {
  const rows = db
    .prepare('SELECT email, reset_token, reset_exp FROM users WHERE reset_token IS NOT NULL AND reset_exp > ?')
    .all(Date.now());
  res.json({
    resets: rows.map((r) => ({ email: r.email, token: r.reset_token, expiresAt: r.reset_exp })),
    emailConfigured: mailConfigured(),
  });
});

app.post('/api/admin/broadcast', requireAdmin, (req, res) => {
  const title = String(req.body?.title || '').trim().slice(0, 120);
  const body = String(req.body?.body || '').trim().slice(0, 1000);
  if (title.length < 3 || body.length < 3) return res.status(400).json({ error: 'Title and message are required.' });
  db.prepare('INSERT INTO broadcasts (id, title, body, audience, admin_id, created_at) VALUES (?,?,?,?,?,?)').run(
    newId(),
    title,
    body,
    'all',
    req.user.id,
    nowIso()
  );
  auditLog(req.user, 'admin.broadcast', title);
  res.status(201).json({ ok: true });
});

app.get('/api/admin/settings', requireAdmin, (_req, res) => {
  res.json({
    settings: {
      contact_email: getSetting('contact_email', 'mohamoudistanbul@gmail.com'),
      contact_phone: getSetting('contact_phone', '+252-612215593'),
      whatsapp: getSetting('whatsapp', '+252612215593'),
      download_url: getSetting('download_url', ''),
      community_enabled: getSetting('community_enabled', 'true'),
    },
  });
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  const allowed = ['contact_email', 'contact_phone', 'whatsapp', 'download_url', 'community_enabled'];
  for (const key of allowed) {
    if (req.body?.[key] !== undefined) {
      const value = String(req.body[key]).slice(0, 300);
      if (key === 'contact_email' && value && !emailOk(value)) {
        return res.status(400).json({ error: 'Contact email is not valid.' });
      }
      if (key === 'download_url' && value && !/^https?:\/\//.test(value)) {
        return res.status(400).json({ error: 'Download URL must start with http:// or https://' });
      }
      setSetting(key, value);
    }
  }
  auditLog(req.user, 'admin.settings.update');
  res.json({ ok: true });
});

/* --------------------------------- static --------------------------------- */

const dist = path.join(__dirname, '..', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
}
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
  const index = path.join(dist, 'index.html');
  if (fs.existsSync(index)) return res.sendFile(index);
  res.status(503).json({ error: 'The app is starting up. Please refresh in a moment.' });
});

app.use((req, res) => res.status(404).json({ error: 'Not found.' }));

app.use((err, _req, res, _next) => {
  console.error('[rifq] error:', err?.message || err);
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`RIFQ Muslim API listening on 0.0.0.0:${PORT}`);
  void warmContent().catch(() => {
    /* warm-up is best effort; requests fall back to on-demand fetching */
  });
});
