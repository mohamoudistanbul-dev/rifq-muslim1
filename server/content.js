import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import tzlookup from 'tz-lookup';
import { COUNTRIES, CITIES } from './cities.js';

/**
 * Read-only proxy to verified Islamic content sources.
 * Nothing here fabricates scripture: Quran text, translations, hadith and
 * place data all come from the upstream provider named in the response.
 */
export const contentRouter = express.Router();

const CACHE_DIR = path.join(process.cwd(), 'data', 'cache');
fs.mkdirSync(CACHE_DIR, { recursive: true });
const mem = new Map();

const UA = 'RIFQMuslim/1.0 (Islamic app; contact mohamoudistanbul@gmail.com)';

async function fetchJson(url, { ttl = 3600, timeout = 20000, headers = {} } = {}) {
  const key = url.replace(/[^a-z0-9]/gi, '_').slice(0, 180);
  const now = Date.now();
  const hot = mem.get(key);
  if (hot && hot.exp > now) return hot.data;
  const file = path.join(CACHE_DIR, `${key}.json`);
  if (fs.existsSync(file)) {
    const stat = fs.statSync(file);
    if (now - stat.mtimeMs < ttl * 1000) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      mem.set(key, { data, exp: now + ttl * 1000 });
      return data;
    }
  }
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json', ...headers },
    signal: AbortSignal.timeout(timeout),
  });
  if (!res.ok) throw new Error(`Upstream ${res.status} for ${new URL(url).host}`);
  const data = await res.json();
  mem.set(key, { data, exp: now + ttl * 1000 });
  try {
    fs.writeFileSync(file, JSON.stringify(data));
  } catch {
    /* cache is best effort */
  }
  return data;
}

const flagOf = (code) =>
  code && code.length === 2
    ? String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)))
    : '';

const safeTz = (lat, lon) => {
  try {
    return tzlookup(lat, lon);
  } catch {
    return 'UTC';
  }
};

/* --------------------------------- cities --------------------------------- */

contentRouter.get('/cities', (_req, res) => {
  res.json({
    countries: COUNTRIES.map(([code, en, ar]) => ({ code, en, ar })),
    cities: CITIES.map(([country, name, lat, lon]) => ({
      country,
      name,
      lat,
      lon,
      timezone: safeTz(lat, lon),
    })),
  });
});

/* ------------------------------- geolocation ------------------------------- */

contentRouter.get('/geo/reverse', async (req, res) => {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return res.status(400).json({ error: 'Valid latitude and longitude are required.' });
  }
  const timezone = safeTz(lat, lon);
  try {
    const data = await fetchJson(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { ttl: 86400 }
    );
    const city =
      data.city || data.locality || data.principalSubdivision || data.countryName || 'Unknown location';
    res.json({
      city,
      locality: data.locality || '',
      region: data.principalSubdivision || '',
      regionCode: data.principalSubdivisionCode || '',
      country: data.countryName || '',
      countryCode: data.countryCode || '',
      flag: flagOf(data.countryCode || ''),
      lat,
      lon,
      timezone,
      source: 'BigDataCloud reverse geocoding + tz-lookup',
      manual: false,
    });
  } catch (err) {
    // Coordinates are still real even when the geocoder is unreachable.
    res.json({
      city: 'Location unavailable',
      locality: '',
      region: '',
      country: '',
      countryCode: '',
      flag: '',
      lat,
      lon,
      timezone,
      source: 'tz-lookup (reverse geocoder unreachable)',
      degraded: true,
      note: `City name lookup failed: ${err.message}`,
      manual: false,
    });
  }
});

contentRouter.get('/geo/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json({ results: [], source: 'none' });
  const local = CITIES.filter(([, name]) => name.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 8)
    .map(([country, name, lat, lon]) => ({
      name,
      country,
      lat,
      lon,
      timezone: safeTz(lat, lon),
      flag: flagOf(country),
      source: 'RIFQ city list',
    }));
  try {
    const rows = await fetchJson(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&addressdetails=1&q=${encodeURIComponent(q)}`,
      { ttl: 86400 }
    );
    const remote = rows.map((r) => {
      const lat = Number(r.lat);
      const lon = Number(r.lon);
      return {
        name: r.name || r.display_name?.split(',')[0] || q,
        region: r.address?.state || r.address?.county || '',
        country: r.address?.country || '',
        countryCode: (r.address?.country_code || '').toUpperCase(),
        lat,
        lon,
        timezone: safeTz(lat, lon),
        flag: flagOf(r.address?.country_code || ''),
        source: 'OpenStreetMap Nominatim',
      };
    });
    const seen = new Set();
    const merged = [...local, ...remote].filter((r) => {
      const k = `${r.name}|${r.country}`.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    res.json({ results: merged.slice(0, 12), source: 'OpenStreetMap Nominatim + RIFQ city list' });
  } catch (err) {
    res.json({ results: local, source: 'RIFQ city list', degraded: true, note: err.message });
  }
});

/* ---------------------------------- Quran --------------------------------- */

contentRouter.get('/quran/surahs', async (_req, res) => {
  try {
    const data = await fetchJson('https://api.alquran.cloud/v1/surah', { ttl: 604800 });
    res.json({ surahs: data.data, source: 'AlQuran Cloud (api.alquran.cloud)' });
  } catch (err) {
    res.status(502).json({ error: `The Quran index could not be loaded: ${err.message}` });
  }
});

contentRouter.get('/quran/surah/:number', async (req, res) => {
  const n = Number(req.params.number);
  if (!Number.isInteger(n) || n < 1 || n > 114) return res.status(400).json({ error: 'Surah number must be 1-114.' });
  const translation = String(req.query.translation || 'en.sahih').replace(/[^a-z0-9.\-]/gi, '');
  try {
    const data = await fetchJson(
      `https://api.alquran.cloud/v1/surah/${n}/editions/quran-uthmani,${translation}`,
      { ttl: 604800 }
    );
    const [arabic, translated] = data.data;
    res.json({
      number: n,
      name: arabic.name,
      englishName: arabic.englishName,
      englishNameTranslation: arabic.englishNameTranslation,
      revelationType: arabic.revelationType,
      ayahCount: arabic.numberOfAyahs,
      translationEdition: translated.edition.identifier,
      ayahs: arabic.ayahs.map((a, i) => ({
        number: a.numberInSurah,
        text: a.text,
        juz: a.juz,
        page: a.page,
        hizbQuarter: a.hizbQuarter,
        sajda: !!a.sajda,
        translation: translated.ayahs[i]?.text || '',
      })),
      source: 'AlQuran Cloud — Quran Uthmani text with the selected translation',
    });
  } catch (err) {
    res.status(502).json({ error: `This surah could not be loaded: ${err.message}` });
  }
});

contentRouter.get('/quran/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const lang = ['en', 'ar', 'so'].includes(String(req.query.lang)) ? req.query.lang : 'en';
  if (q.length < 2) return res.json({ matches: [], source: 'none' });
  const edition = lang === 'ar' ? 'quran-simple' : lang === 'so' ? 'so.abduh' : 'en.sahih';
  try {
    const data = await fetchJson(
      `https://api.alquran.cloud/v1/search/${encodeURIComponent(q)}/all/${edition}`,
      { ttl: 86400 }
    );
    res.json({
      matches: (data.data?.matches || []).slice(0, 60).map((m) => ({
        surah: m.surah?.number,
        surahName: m.surah?.englishName,
        ayah: m.numberInSurah,
        text: m.text,
      })),
      count: data.data?.count || 0,
      source: `AlQuran Cloud search (${edition})`,
    });
  } catch (err) {
    res.status(502).json({ error: `Search is unavailable right now: ${err.message}` });
  }
});

/* ---------------------------------- Hadith -------------------------------- */

const HADITH_COLLECTIONS = [
  { key: 'bukhari', name: 'Sahih al-Bukhari', arabic: 'صحيح البخاري' },
  { key: 'muslim', name: 'Sahih Muslim', arabic: 'صحيح مسلم' },
  { key: 'abudawud', name: 'Sunan Abu Dawud', arabic: 'سنن أبي داود' },
  { key: 'tirmidhi', name: 'Jami at-Tirmidhi', arabic: 'جامع الترمذي' },
  { key: 'nasai', name: "Sunan an-Nasa'i", arabic: 'سنن النسائي' },
  { key: 'ibnmajah', name: 'Sunan Ibn Majah', arabic: 'سنن ابن ماجه' },
];

contentRouter.get('/hadith/collections', (_req, res) => {
  res.json({ collections: HADITH_COLLECTIONS, source: 'hadith-api (fawazahmed0) on jsDelivr' });
});

async function loadCollection(key) {
  const meta = HADITH_COLLECTIONS.find((c) => c.key === key);
  if (!meta) throw new Error('Unknown collection');
  const base = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';
  const [ara, eng] = await Promise.all([
    fetchJson(`${base}/ara-${key}.min.json`, { ttl: 604800, timeout: 30000 }),
    fetchJson(`${base}/eng-${key}.min.json`, { ttl: 604800, timeout: 30000 }),
  ]);
  const engMap = new Map((eng.hadiths || []).map((h) => [h.hadithnumber, h.text]));
  const items = (ara.hadiths || []).map((h) => ({
    number: h.hadithnumber,
    arabic: h.text,
    english: engMap.get(h.hadithnumber) || '',
    grades: (h.grades || []).map((g) => `${g.name}: ${g.grade}`),
  }));
  return { ...meta, items, source: `hadith-api — ${meta.name} (Arabic + English)` };
}

contentRouter.get('/hadith/:collection', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const size = Math.min(50, Math.max(5, Number(req.query.size) || 20));
  try {
    const all = await loadCollection(String(req.params.collection));
    const start = (page - 1) * size;
    res.json({
      collection: all.key,
      name: all.name,
      arabic: all.arabic,
      total: all.items.length,
      page,
      size,
      items: all.items.slice(start, start + size),
      source: all.source,
    });
  } catch (err) {
    res.status(502).json({ error: `Hadith collection unavailable: ${err.message}` });
  }
});

contentRouter.get('/hadith/:collection/search', async (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  if (q.length < 3) return res.json({ matches: [], source: 'none' });
  try {
    const all = await loadCollection(String(req.params.collection));
    const matches = all.items
      .filter((h) => h.english.toLowerCase().includes(q) || h.arabic.includes(q))
      .slice(0, 40);
    res.json({ matches, count: matches.length, source: all.source });
  } catch (err) {
    res.status(502).json({ error: `Search failed: ${err.message}` });
  }
});

/* --------------------------------- places --------------------------------- */

const haversine = (a, b, c, d) => {
  const R = 6371;
  const dLat = ((c - a) * Math.PI) / 180;
  const dLon = ((d - b) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos((a * Math.PI) / 180) * Math.cos((c * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

contentRouter.get('/places', async (req, res) => {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  const kind = req.query.kind === 'halal' ? 'halal' : 'mosque';
  const radius = Math.min(20000, Math.max(500, Number(req.query.radius) || 5000));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ error: 'Latitude and longitude are required.' });
  }
  const query =
    kind === 'mosque'
      ? `[out:json][timeout:25];(node(around:${radius},${lat},${lon})[amenity=place_of_worship][religion=muslim];way(around:${radius},${lat},${lon})[amenity=place_of_worship][religion=muslim];);out center 40;`
      : `[out:json][timeout:25];(node(around:${radius},${lat},${lon})[amenity~"restaurant|fast_food|cafe"][diet:halal=yes];node(around:${radius},${lat},${lon})[shop~"butcher|supermarket|greengrocer"][diet:halal=yes];way(around:${radius},${lat},${lon})[amenity=restaurant][diet:halal=yes];);out center 40;`;

  const mirrors = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
  ];
  let lastErr = null;
  for (const url of mirrors) {
    try {
      const data = await fetchJson(`${url}?data=${encodeURIComponent(query)}`, { ttl: 1800, timeout: 30000 });
      const places = (data.elements || [])
        .map((e) => {
          const plat = e.lat ?? e.center?.lat;
          const plon = e.lon ?? e.center?.lon;
          if (plat == null || plon == null) return null;
          const tags = e.tags || {};
          return {
            id: `${e.type}/${e.id}`,
            name: tags.name || tags['name:en'] || tags['name:ar'] || (kind === 'mosque' ? 'Unnamed mosque' : 'Unnamed place'),
            lat: plat,
            lon: plon,
            distanceKm: Number(haversine(lat, lon, plat, plon).toFixed(2)),
            address: [tags['addr:street'], tags['addr:city']].filter(Boolean).join(', '),
            phone: tags.phone || tags['contact:phone'] || '',
            website: tags.website || tags['contact:website'] || '',
            cuisine: tags.cuisine || '',
            kind,
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.distanceKm - b.distanceKm);
      return res.json({
        places,
        source: 'OpenStreetMap via Overpass API',
        radiusMeters: radius,
        verified: false,
        note: places.length
          ? 'Places come from OpenStreetMap contributors. Opening hours and halal certification are not verified — please confirm locally.'
          : 'No entries were returned by OpenStreetMap within this radius. Community mapping is incomplete in many areas.',
      });
    } catch (err) {
      lastErr = err;
    }
  }
  res.status(502).json({
    error: `Place search is unavailable right now (${lastErr?.message || 'no mirror responded'}).`,
  });
});

/* --------------------------------- metals --------------------------------- */

contentRouter.get('/metals', async (_req, res) => {
  try {
    const [gold, silver] = await Promise.all([
      fetchJson('https://api.gold-api.com/price/XAU', { ttl: 3600, timeout: 8000 }),
      fetchJson('https://api.gold-api.com/price/XAG', { ttl: 3600, timeout: 8000 }),
    ]);
    res.json({
      goldUsdPerOunce: gold.price,
      silverUsdPerOunce: silver.price,
      updatedAt: gold.updatedAt,
      source: 'gold-api.com spot price (USD per troy ounce)',
    });
  } catch (err) {
    res.status(502).json({ error: `Live metal prices are unavailable: ${err.message}` });
  }
});

/**
 * Warm the heaviest upstream caches in the background right after boot so the
 * first visitor is not the one paying for a cold download.
 */
export async function warmContent() {
  await Promise.allSettled([
    fetchJson('https://api.alquran.cloud/v1/surah', { ttl: 604800 }),
    loadCollection('bukhari'),
  ]);
}
