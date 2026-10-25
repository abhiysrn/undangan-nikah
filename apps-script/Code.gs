/**
 * Google Apps Script — penyimpanan RSVP di Google Sheets.
 *
 * Cara pakai (ringkas; langkah lengkap ada di README.md):
 *   1. Buat Google Sheet baru, lalu buka  Extensions > Apps Script.
 *   2. Tempel seluruh isi file ini, simpan.
 *   3. Project Settings > Script properties > tambahkan properti
 *        SECRET = (teks acak panjang, mis. 32+ karakter)
 *   4. Jalankan fungsi `setup` satu kali (izinkan akses saat diminta).
 *   5. Deploy > New deployment > Web app
 *        Execute as: Me   |   Who has access: Anyone
 *      Salin URL berakhiran /exec  ->  dipakai sebagai APPS_SCRIPT_URL di Vercel.
 *
 * Keamanan: URL Web App ini TIDAK ditaruh di frontend. Hanya fungsi server Vercel
 * (api/rsvp.js) yang memanggilnya, dan setiap panggilan wajib membawa SECRET.
 */

var SHEET_NAME = 'RSVP';
var HEADERS = ['Waktu', 'Nama', 'Kehadiran', 'Jumlah Tamu', 'Ucapan'];
var MAX_LIMIT = 200;

/** Jalankan sekali dari editor untuk membuat tab "RSVP" beserta judul kolomnya. */
function setup() {
  var sheet = getSheet_();
  if (!getSecret_()) {
    throw new Error('Script property SECRET belum diatur (Project Settings > Script properties).');
  }
  return 'OK — tab "' + sheet.getName() + '" siap.';
}

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    if (!authorized_(p.secret)) return json_({ ok: false, error: 'unauthorized' });

    var limit = Math.min(Math.max(parseInt(p.limit, 10) || 100, 1), MAX_LIMIT);
    var sheet = getSheet_();
    var last = sheet.getLastRow();
    var wishes = [];

    if (last >= 2) {
      var rows = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
      for (var i = rows.length - 1; i >= 0 && wishes.length < limit; i--) {
        var r = rows[i];
        var wish = String(r[4] || '').trim();
        if (!wish) continue; // hanya yang menulis ucapan yang tampil di buku tamu
        wishes.push({
          at: String(r[0] || ''),
          name: String(r[1] || ''),
          attendance: String(r[2] || ''),
          wish: wish
        });
      }
    }
    return json_({ ok: true, wishes: wishes });
  } catch (err) {
    return json_({ ok: false, error: 'server_error' });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!authorized_(data.secret)) return json_({ ok: false, error: 'unauthorized' });

    var name = clean_(data.name, 80);
    var attendance = data.attendance === 'hadir' ? 'hadir' : data.attendance === 'tidak-hadir' ? 'tidak-hadir' : '';
    var guests = parseInt(data.guests, 10);
    var wish = clean_(data.wish, 1000);

    if (name.length < 2 || !attendance) return json_({ ok: false, error: 'invalid' });
    if (attendance === 'tidak-hadir') guests = 0;
    if (isNaN(guests) || guests < 0 || guests > 100) return json_({ ok: false, error: 'invalid' });

    lock.waitLock(15000); // cegah tabrakan bila dua tamu mengirim bersamaan
    var sheet = getSheet_();
    var row = sheet.getLastRow() + 1;
    var range = sheet.getRange(row, 1, 1, HEADERS.length);
    // Format "teks" supaya isi seperti =RUMUS() atau +62... tidak pernah dijalankan sebagai rumus.
    range.setNumberFormat('@');
    range.setValues([[new Date().toISOString(), name, attendance, String(guests), wish]]);
    SpreadsheetApp.flush();
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: 'server_error' });
  } finally {
    try { lock.releaseLock(); } catch (ignore) { /* tidak memegang lock */ }
  }
}

/* ------------------------------------------------------------ pembantu */

function getSecret_() {
  return PropertiesService.getScriptProperties().getProperty('SECRET');
}

function authorized_(provided) {
  var secret = getSecret_();
  if (!secret || !provided) return false;
  provided = String(provided);
  if (provided.length !== secret.length) return false;
  var diff = 0; // perbandingan waktu-konstan
  for (var i = 0; i < secret.length; i++) diff |= secret.charCodeAt(i) ^ provided.charCodeAt(i);
  return diff === 0;
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    var head = sheet.getRange(1, 1, 1, HEADERS.length);
    head.setValues([HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.getRange('A:E').setNumberFormat('@');
    sheet.setColumnWidth(1, 190);
    sheet.setColumnWidth(2, 180);
    sheet.setColumnWidth(5, 420);
  }
  return sheet;
}

function clean_(value, max) {
  return String(value == null ? '' : value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .substring(0, max);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
