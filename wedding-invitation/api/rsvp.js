/**
 * Vercel Serverless Function — penghubung antara website undangan dan Google Sheets.
 *
 *   GET  /api/rsvp  -> daftar ucapan untuk buku tamu
 *   POST /api/rsvp  -> menyimpan RSVP baru
 *
 * Peran file ini:
 *   - menjaga URL & kunci rahasia Google Apps Script tetap di server (Environment Variables),
 *     sehingga TIDAK pernah muncul di kode frontend;
 *   - memvalidasi dan membersihkan input sebelum disimpan;
 *   - menolak permintaan lintas-situs, bot sederhana (honeypot), dan spam berlebihan.
 *
 * Environment Variables (diatur di dashboard Vercel):
 *   APPS_SCRIPT_URL     URL Web App Google Apps Script (berakhiran /exec)
 *   APPS_SCRIPT_SECRET  kunci rahasia yang sama dengan Script Property "SECRET" di Apps Script
 *   MAX_GUESTS          (opsional) batas jumlah tamu per RSVP, bawaan 10
 */
'use strict';

const intEnv = (value, min, max, fallback) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

const MAX_GUESTS = intEnv(process.env.MAX_GUESTS, 1, 50, 10);
const MAX_NAME = 80;
const MAX_WISH = 1000; // batas keras di server; batas tampilan diatur di js/config.js
const ATTENDANCE = ['hadir', 'tidak-hadir'];

// Pembatas laju sederhana (per instance serverless; cukup sebagai lapisan pertama).
const RATE = { windowMs: 60 * 1000, max: 6 };
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE.windowMs);
  if (recent.length >= RATE.max) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [key, list] of hits) {
      if (!list.some((t) => now - t < RATE.windowMs)) hits.delete(key);
    }
  }
  return false;
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  const first = (Array.isArray(fwd) ? fwd[0] : fwd || '').split(',')[0].trim();
  return first || (req.socket && req.socket.remoteAddress) || 'unknown';
}

function send(res, status, body, extraHeaders) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  Object.entries(extraHeaders || {}).forEach(([k, v]) => res.setHeader(k, v));
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') return JSON.parse(req.body);
    if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString('utf8'));
    return req.body;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 20 * 1024) throw new Error('payload_too_large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

// Membersihkan teks: buang karakter kontrol, rapikan spasi, batasi panjang.
function cleanLine(value, max) {
  return String(value == null ? '' : value)
    .replace(/[\p{Cc}\p{Zl}\p{Zp}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}
function cleanText(value, max) {
  return String(value == null ? '' : value)
    .replace(/\r\n?/g, '\n')
    .replace(/[\p{Cc}\p{Zl}\p{Zp}]/gu, (c) => (c === '\n' ? c : c === '\t' ? ' ' : ''))
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

function validate(input) {
  const fields = {};
  const name = cleanLine(input.name, MAX_NAME);
  const attendance = String(input.attendance || '');
  const wish = cleanText(input.wish, MAX_WISH);
  let guests = parseInt(input.guests, 10);

  if (name.length < 2) fields.name = 'Mohon isi nama Anda.';
  if (!ATTENDANCE.includes(attendance)) fields.attendance = 'Mohon pilih konfirmasi kehadiran.';

  if (attendance === 'hadir') {
    if (!Number.isFinite(guests) || guests < 1 || guests > MAX_GUESTS) {
      fields.guests = 'Jumlah tamu harus antara 1 dan ' + MAX_GUESTS + '.';
    }
  } else {
    guests = 0;
  }

  if (Object.keys(fields).length) return { ok: false, fields };
  return { ok: true, value: { name, attendance, guests, wish } };
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // permintaan same-origin biasa tidak selalu menyertakan Origin
  try {
    return new URL(origin).host === req.headers.host;
  } catch (e) {
    return false;
  }
}

async function callAppsScript(method, payload) {
  const url = process.env.APPS_SCRIPT_URL;
  const secret = process.env.APPS_SCRIPT_SECRET;
  if (!url || !secret) {
    const err = new Error('not_configured');
    err.code = 'not_configured';
    throw err;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    let res;
    if (method === 'GET') {
      const target = new URL(url);
      target.searchParams.set('secret', secret);
      target.searchParams.set('limit', '200');
      res = await fetch(target, { redirect: 'follow', signal: ctrl.signal });
    } else {
      // text/plain menghindari preflight CORS; Apps Script tetap membaca isinya sebagai JSON.
      res = await fetch(url, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(Object.assign({}, payload, { secret })),
        signal: ctrl.signal
      });
    }
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      const err = new Error('bad_upstream_response');
      err.code = 'upstream_error';
      throw err;
    }
    if (!data || data.ok !== true) {
      const err = new Error((data && data.error) || 'upstream_error');
      err.code = 'upstream_error';
      throw err;
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'GET' && req.method !== 'POST') {
      return send(res, 405, { ok: false, error: 'method_not_allowed' }, { Allow: 'GET, POST' });
    }
    if (!sameOrigin(req)) {
      return send(res, 403, { ok: false, error: 'forbidden' });
    }

    if (req.method === 'GET') {
      const data = await callAppsScript('GET');
      const wishes = (Array.isArray(data.wishes) ? data.wishes : [])
        .slice(0, 200)
        .map((w) => ({
          name: cleanLine(w.name, MAX_NAME),
          attendance: ATTENDANCE.includes(w.attendance) ? w.attendance : 'hadir',
          wish: cleanText(w.wish, MAX_WISH),
          at: cleanLine(w.at, 40)
        }))
        .filter((w) => w.name && w.wish);
      return send(res, 200, { ok: true, wishes });
    }

    // ---- POST ----
    if (rateLimited(clientIp(req))) {
      return send(res, 429, { ok: false, error: 'rate_limited' }, { 'Retry-After': '60' });
    }

    let body;
    try {
      body = await readBody(req);
    } catch (e) {
      return send(res, 400, { ok: false, error: 'bad_request' });
    }
    if (!body || typeof body !== 'object') {
      return send(res, 400, { ok: false, error: 'bad_request' });
    }

    // Honeypot: bot mengisi kolom tersembunyi -> pura-pura sukses tanpa menyimpan apa pun.
    if (typeof body.website === 'string' && body.website.trim() !== '') {
      return send(res, 200, { ok: true });
    }

    const result = validate(body);
    if (!result.ok) {
      return send(res, 400, { ok: false, error: 'validation', fields: result.fields });
    }

    await callAppsScript('POST', result.value);
    return send(res, 200, { ok: true });
  } catch (err) {
    if (err && err.code === 'not_configured') {
      return send(res, 503, { ok: false, error: 'not_configured' });
    }
    // Jangan pernah mencatat URL/secret; cukup pesan singkat.
    console.error('[rsvp] gagal:', err && err.message ? err.message : err);
    return send(res, 502, { ok: false, error: 'upstream_error' });
  }
};
