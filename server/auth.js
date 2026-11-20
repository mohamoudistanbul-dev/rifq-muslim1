import crypto from 'node:crypto';
import { db, getSetting, setSetting } from './db.js';

const SCRYPT_N = 16384;
const KEYLEN = 64;

function secret() {
  let s = process.env.SESSION_SECRET || getSetting('session_secret');
  if (!s) {
    s = crypto.randomBytes(48).toString('hex');
    setSetting('session_secret', s);
  }
  return s;
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, KEYLEN, { N: SCRYPT_N }).toString('hex');
  return `scrypt$${SCRYPT_N}$${salt}$${hash}`;
}

export function verifyPassword(password, stored) {
  try {
    const [scheme, n, salt, hash] = String(stored).split('$');
    if (scheme !== 'scrypt') return false;
    const candidate = crypto.scryptSync(password, salt, KEYLEN, { N: Number(n) });
    const expected = Buffer.from(hash, 'hex');
    return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

const b64u = (buf) => Buffer.from(buf).toString('base64url');

export function signSession(user) {
  const payload = b64u(
    JSON.stringify({ u: user.id, v: user.token_version, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 })
  );
  const sig = crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function readSession(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
  const a = Buffer.from(sig || '');
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let data;
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!data?.u || !data?.exp || data.exp < Date.now()) return null;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(data.u);
  if (!user || user.banned) return null;
  if (Number(user.token_version) !== Number(data.v)) return null;
  return user;
}

export const COOKIE = 'rifq_session';

export function cookieOptions(req) {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 30,
  };
}

export function attachUser(req, _res, next) {
  const raw = req.cookies?.[COOKIE];
  req.user = readSession(raw) || null;
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please sign in to continue.' });
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please sign in to continue.' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Administrator access required.' });
  next();
}

export const emailOk = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || '').trim());

export function passwordProblem(password) {
  const p = String(password || '');
  if (p.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[A-Za-z]/.test(p) || !/[0-9]/.test(p)) return 'Password must include letters and numbers.';
  return null;
}

export const token = () => crypto.randomBytes(24).toString('hex');

export function rateLimit({ windowMs = 60_000, max = 20 } = {}) {
  const hits = new Map();
  return (req, res, next) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || now > entry.reset) {
      hits.set(key, { count: 1, reset: now + windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      return res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
    }
    next();
  };
}
