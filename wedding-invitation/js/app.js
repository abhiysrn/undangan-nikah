/* ==========================================================================
   Logika undangan. Anda TIDAK perlu mengedit file ini untuk mengganti data —
   ubah saja js/config.js.
   ========================================================================== */
(function () {
  'use strict';

  const C = window.INVITATION;
  if (!C) {
    console.error('[undangan] js/config.js tidak termuat.');
    return;
  }

  const doc = document;
  const root = doc.documentElement;
  const $ = (sel, el) => (el || doc).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || doc).querySelectorAll(sel));
  const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  // Cegah browser memulihkan posisi scroll saat layar pembuka masih aktif.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  /* ------------------------------------------------------------------ util */

  /** Membuat elemen DOM dengan aman (selalu lewat textContent, bukan innerHTML). */
  function h(tag, props, ...kids) {
    const node = doc.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    });
    kids.flat().forEach((kid) => {
      if (kid == null || kid === false) return;
      node.append(kid.nodeType ? kid : doc.createTextNode(String(kid)));
    });
    return node;
  }

  const people = (C.couple && C.couple.people) || [];
  const events = (C.event && C.event.items) || [];
  const TZ = (C.event && C.event.timezone) || 'Asia/Makassar';
  const TZ_LABEL = (C.event && C.event.timezoneLabel) || '';

  const dtf = (opts) => new Intl.DateTimeFormat('id-ID', Object.assign({ timeZone: TZ }, opts));
  const validDate = (d) => d instanceof Date && !isNaN(d.getTime());
  const longDate = (d) => dtf({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  const timeOnly = (d) => dtf({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);
  function numericDate(d) {
    const parts = {};
    dtf({ day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(d).forEach((p) => { parts[p.type] = p.value; });
    return parts.day + '.' + parts.month + '.' + parts.year;
  }
  function weekdayName(d) { return dtf({ weekday: 'long' }).format(d); }

  /* Tanggal acara pertama dipakai untuk judul-judul tanggal */
  const firstStart = events.length ? new Date(events[0].start) : null;
  events.forEach((ev) => {
    if (!validDate(new Date(ev.start))) console.warn('[undangan] Tanggal tidak valid pada acara:', ev.id || ev.title);
  });

  /* ------------------------------------------------------- isi halaman */

  const cover = $('#cover');
  const main = $('#main');

  function renderNames(target) {
    target.textContent = '';
    people.forEach((p, i) => {
      const name = h('span', { class: 'name' }, p.nickname);
      if (i === 0) target.append(name);
      // "& Nama" dijaga satu baris supaya tanda & tidak terpisah di akhir baris
      else target.append(h('span', { class: 'pair' }, h('span', { class: 'amp', 'aria-hidden': 'true' }, '&'), name));
    });
    target.setAttribute('aria-label', people.map((p) => p.nickname).join(' dan '));
  }

  function setImage(img, src, alt) {
    if (!img || !src) return;
    img.src = src;
    img.alt = alt || '';
  }

  function renderStatic() {
    if (C.meta && C.meta.title) doc.title = C.meta.title;
    const metaDesc = $('meta[name="description"]');
    if (metaDesc && C.meta && C.meta.description) metaDesc.setAttribute('content', C.meta.description);

    // Sampul
    renderNames($('#cover-names'));
    renderNames($('#hero-names'));
    renderNames($('#footer-names'));
    const names = people.map((p) => p.nickname).join(' dan ');
    setImage($('#cover-photo'), C.photos && C.photos.cover, 'Foto ' + names);
    setImage($('#hero-photo'), C.photos && C.photos.hero, '');
    if (C.photos && C.photos.heroFocus) $('#hero-photo').style.objectPosition = C.photos.heroFocus;

    if (validDate(firstStart)) {
      const line = weekdayName(firstStart) + ' · ' + numericDate(firstStart);
      $('#cover-date').textContent = line;
      $('#hero-date').textContent = line;
      $('#cd-date').textContent = longDate(firstStart);
    }

    // Tamu (dari ?to=Nama+Tamu)
    const guest = (new URLSearchParams(location.search).get('to') || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    if (guest) {
      $('#guest-name').textContent = guest;
      $('#cover-guest').hidden = false;
      $('#rsvp-name').value = guest;
    }

    // Teks
    const t = C.texts || {};
    $('#intro-greeting').textContent = t.greeting || '';
    $('#intro-text').textContent = t.intro || '';
    if (t.quote) {
      $('#quote-text').textContent = '“' + t.quote + '”';
      if (t.quoteSource) { $('#quote-source').textContent = t.quoteSource; $('#quote-source').hidden = false; }
    } else {
      $('#intro-quote').hidden = true;
      $('.rule', $('.intro')).hidden = true;
    }
    $('#footer-text').textContent = t.closing || '';
    $('#events-note').textContent = (C.event && C.event.note) || '';
    $('#events-note').hidden = !(C.event && C.event.note);
  }

  function renderPeople() {
    const box = $('#people');
    people.forEach((p, i) => {
      const photo = h('div', { class: 'person__photo' },
        h('img', { src: p.photo, alt: 'Foto ' + p.fullName, loading: 'lazy', decoding: 'async', width: 900, height: 1125 }));
      const ig = p.instagram
        ? h('a', { class: 'person__ig', href: 'https://instagram.com/' + encodeURIComponent(p.instagram), target: '_blank', rel: 'noopener noreferrer', text: '@' + p.instagram })
        : null;
      box.append(h('article', { class: 'person', 'data-reveal': '', style: '--d:' + (i * 120) },
        photo,
        h('p', { class: 'eyebrow person__role', text: p.role }),
        h('h3', { class: 'person__name', text: p.nickname }),
        h('p', { class: 'person__full', text: p.fullName }),
        p.parents ? h('p', { class: 'person__parents', text: p.parents }) : null,
        ig));
    });
  }

  /* ----------------------------------------------------- galeri + lightbox */

  const gallery = (C.photos && C.photos.gallery) || [];
  const lb = { dlg: $('#lightbox'), img: $('#lb-img'), count: $('#lb-count'), index: 0 };

  function renderGallery() {
    const grid = $('#gallery-grid');
    if (!gallery.length) { $('#gallery').hidden = true; return; }
    gallery.forEach((g, i) => {
      const ratio = g.ratio || '4/5';
      grid.append(h('button', {
        type: 'button', class: 'gallery__item', 'data-reveal': '', style: 'aspect-ratio:' + ratio + ';--d:' + ((i % 3) * 90),
        'aria-label': 'Buka foto ' + (i + 1) + ' dari ' + gallery.length, onclick: () => openLightbox(i)
      }, h('img', { src: g.src, alt: g.alt || '', loading: 'lazy', decoding: 'async' })));
    });
  }

  function showPhoto(i) {
    lb.index = (i + gallery.length) % gallery.length;
    const g = gallery[lb.index];
    lb.img.src = g.src;
    lb.img.alt = g.alt || '';
    lb.count.textContent = String(lb.index + 1).padStart(2, '0') + ' / ' + String(gallery.length).padStart(2, '0');
    // muat foto tetangga lebih awal
    [lb.index + 1, lb.index - 1].forEach((n) => { new Image().src = gallery[(n + gallery.length) % gallery.length].src; });
  }
  function openLightbox(i) {
    showPhoto(i);
    if (typeof lb.dlg.showModal === 'function') lb.dlg.showModal();
    else lb.dlg.setAttribute('open', '');
    root.classList.add('lb-open');
  }
  function closeLightbox() {
    if (typeof lb.dlg.close === 'function') lb.dlg.close();
    else lb.dlg.removeAttribute('open');
    root.classList.remove('lb-open');
  }
  function setupLightbox() {
    $('#lb-close').addEventListener('click', closeLightbox);
    $('#lb-prev').addEventListener('click', () => showPhoto(lb.index - 1));
    $('#lb-next').addEventListener('click', () => showPhoto(lb.index + 1));
    lb.dlg.addEventListener('close', () => root.classList.remove('lb-open'));
    lb.dlg.addEventListener('click', (e) => { if (e.target === lb.dlg) closeLightbox(); });
    lb.dlg.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') showPhoto(lb.index - 1);
      if (e.key === 'ArrowRight') showPhoto(lb.index + 1);
    });
    let startX = null;
    lb.dlg.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    lb.dlg.addEventListener('touchend', (e) => {
      if (startX == null) return;
      const dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) showPhoto(lb.index + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* ------------------------------------------------------------ acara */

  function mapsLink(ev) {
    if (ev.mapsUrl) return ev.mapsUrl;
    const q = [ev.venue, ev.address].filter(Boolean).join(', ');
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
  }

  function icsStamp(d) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
  function icsEscape(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }

  function downloadCalendar(ev) {
    const start = new Date(ev.start);
    if (!validDate(start)) return;
    const end = ev.end && validDate(new Date(ev.end)) ? new Date(ev.end) : new Date(start.getTime() + 2 * 3600 * 1000);
    const coupleNames = people.map((p) => p.nickname).join(' & ');
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Undangan Pernikahan//ID', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:' + (ev.id || 'acara') + '-' + icsStamp(start) + '@undangan',
      'DTSTAMP:' + icsStamp(new Date()),
      'DTSTART:' + icsStamp(start),
      'DTEND:' + icsStamp(end),
      'SUMMARY:' + icsEscape(ev.title + ' — ' + coupleNames),
      'LOCATION:' + icsEscape([ev.venue, ev.address].filter(Boolean).join(', ')),
      'DESCRIPTION:' + icsEscape('Undangan pernikahan ' + coupleNames + '. ' + mapsLink(ev)),
      'END:VEVENT', 'END:VCALENDAR'
    ];
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = h('a', { href: url, download: (ev.id || 'acara') + '.ics' });
    doc.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function renderEvents() {
    const list = $('#events-list');
    events.forEach((ev, i) => {
      const s = new Date(ev.start);
      const e = ev.end ? new Date(ev.end) : null;
      const okStart = validDate(s);
      const time = okStart
        ? timeOnly(s) + (e && validDate(e) ? ' – ' + timeOnly(e) : '') + (TZ_LABEL ? ' ' + TZ_LABEL : '')
        : '';
      list.append(h('article', { class: 'event', 'data-reveal': '', style: '--d:' + (i * 120) },
        h('p', { class: 'event__index', text: String(i + 1).padStart(2, '0') }),
        h('h3', { class: 'event__title', text: ev.title }),
        okStart ? h('p', { class: 'event__date', text: longDate(s) }) : null,
        time ? h('p', { class: 'event__time', text: time }) : null,
        h('p', { class: 'event__venue', text: ev.venue }),
        ev.address ? h('p', { class: 'event__address', text: ev.address }) : null,
        h('div', { class: 'event__actions' },
          h('a', { class: 'btn', href: mapsLink(ev), target: '_blank', rel: 'noopener noreferrer' }, 'Buka Google Maps'),
          okStart ? h('button', { type: 'button', class: 'link', onclick: () => downloadCalendar(ev) }, 'Simpan ke kalender') : null)));
    });
  }

  /* -------------------------------------------------------- hitung mundur */

  function setupCountdown() {
    const section = $('#countdown');
    const target = new Date((C.event && C.event.countdownTo) || (events[0] && events[0].start)).getTime();
    if (isNaN(target)) { section.hidden = true; return; }
    const nodes = {
      days: $('[data-unit="days"]'), hours: $('[data-unit="hours"]'),
      minutes: $('[data-unit="minutes"]'), seconds: $('[data-unit="seconds"]')
    };
    const pad = (n) => String(n).padStart(2, '0');
    let timer = null;
    function tick() {
      const diff = target - Date.now();
      if (!(diff > 0)) {
        $('#cd').hidden = true;
        const done = $('#cd-done');
        done.textContent = (C.texts && C.texts.countdownDone) || '';
        done.hidden = false;
        if (timer) clearInterval(timer);
        return;
      }
      const s = Math.floor(diff / 1000);
      nodes.days.textContent = pad(Math.floor(s / 86400));
      nodes.hours.textContent = pad(Math.floor((s % 86400) / 3600));
      nodes.minutes.textContent = pad(Math.floor((s % 3600) / 60));
      nodes.seconds.textContent = pad(s % 60);
    }
    tick();
    timer = setInterval(tick, 1000);
  }

  /* ----------------------------------------------------------- scroll reveal */

  let io = null;
  let revealStarted = false;
  const canObserve = 'IntersectionObserver' in window && !reduceMotion;

  function startReveals() {
    revealStarted = true;
    const els = $$('[data-reveal]');
    if (!canObserve) { els.forEach((el) => el.classList.add('is-visible')); return; }
    io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-visible');
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach((el) => io.observe(el));
  }
  /** Untuk elemen yang ditambahkan setelah halaman dibuka (mis. ucapan baru). */
  function reveal(el) {
    if (io) io.observe(el);
    else if (revealStarted) el.classList.add('is-visible');
  }

  /* ------------------------------------------------------------------ musik */

  const audio = $('#bgm');
  const musicBtn = $('#music-btn');
  const hasMusic = !!(C.music && C.music.src);
  let musicOk = hasMusic;

  function syncMusicUI() {
    const playing = !audio.paused;
    musicBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    musicBtn.setAttribute('aria-label', playing ? 'Jeda musik' : 'Putar musik');
  }
  function setupMusic() {
    if (!hasMusic) { musicBtn.remove(); audio.remove(); return; }
    audio.src = C.music.src;
    audio.loop = C.music.loop !== false;
    audio.volume = clamp(typeof C.music.volume === 'number' ? C.music.volume : 0.6, 0, 1);
    audio.addEventListener('play', syncMusicUI);
    audio.addEventListener('pause', syncMusicUI);
    audio.addEventListener('error', () => {
      musicOk = false;
      musicBtn.hidden = true;
      console.warn('[undangan] File musik tidak dapat dimuat:', C.music.src);
    });
    musicBtn.addEventListener('click', () => {
      if (audio.paused) {
        const p = audio.play();
        if (p && p.catch) p.catch(() => {});
      } else {
        audio.pause();
      }
    });
    syncMusicUI();
  }
  /** Dipanggil langsung dari klik "Buka Undangan" supaya diizinkan browser. */
  function startMusic() {
    if (!hasMusic || !musicOk) return;
    const p = audio.play();
    if (p && p.catch) p.catch(() => { /* diblokir browser: pengguna masih bisa menekan tombol musik */ });
  }

  /* ----------------------------------------------------- buka undangan */

  let opened = false;
  function openInvitation() {
    if (opened) return;
    opened = true;

    startMusic();

    main.removeAttribute('inert');
    main.classList.add('is-open');
    cover.classList.add('is-leaving');
    window.scrollTo(0, 0);
    if (hasMusic && musicOk) musicBtn.hidden = false;
    startReveals();

    setTimeout(() => {
      cover.hidden = true;
      root.classList.remove('is-locked');
      window.scrollTo(0, 0);
      try { main.focus({ preventScroll: true }); } catch (e) { /* abaikan */ }
    }, reduceMotion ? 0 : 1250);
  }

  /* ----------------------------------------------------------------- API */

  const ENDPOINT = (C.rsvp && C.rsvp.endpoint) || '/api/rsvp';

  async function api(method, body) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
      const res = await fetch(ENDPOINT, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store',
        signal: ctrl.signal
      });
      let data = null;
      try { data = await res.json(); } catch (e) { /* bukan JSON */ }
      if (!res.ok || !data || data.ok === false) {
        const err = new Error((data && data.error) || 'request_failed');
        err.code = (data && data.error) || 'request_failed';
        err.fields = (data && data.fields) || null;
        err.status = res.status;
        throw err;
      }
      return data;
    } catch (e) {
      if (e && e.name === 'AbortError') { const err = new Error('timeout'); err.code = 'timeout'; throw err; }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }

  function friendlyError(err) {
    switch (err && err.code) {
      case 'not_configured':
        return 'Penyimpanan RSVP belum dihubungkan. (Pemilik undangan: ikuti bagian “Backend RSVP” di README.)';
      case 'rate_limited':
        return 'Terlalu banyak percobaan. Silakan coba lagi beberapa saat lagi.';
      default:
        return 'Belum berhasil terkirim. Periksa koneksi internet Anda, lalu coba lagi.';
    }
  }

  /* ---------------------------------------------------------------- RSVP */

  const form = $('#rsvp-form');
  const statusEl = $('#rsvp-status');
  const submitBtn = $('#rsvp-submit');
  const maxGuests = clamp(parseInt(C.rsvp && C.rsvp.maxGuests, 10) || 5, 1, 50);
  const maxWish = clamp(parseInt(C.rsvp && C.rsvp.maxWishLength, 10) || 300, 20, 1000);

  function setFieldError(id, input, msg) {
    const out = $('#' + id);
    if (out) out.textContent = msg || '';
    if (input) {
      if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    }
  }
  function setStatus(msg, isError) {
    statusEl.textContent = msg || '';
    statusEl.classList.toggle('is-error', !!isError);
  }

  function setupRsvp() {
    const guestsSel = $('#rsvp-guests');
    for (let i = 1; i <= maxGuests; i++) guestsSel.append(h('option', { value: i, text: i + ' orang' }));

    const wish = $('#rsvp-wish');
    wish.setAttribute('maxlength', String(maxWish));
    $('#wish-max').textContent = String(maxWish);
    wish.addEventListener('input', () => { $('#wish-count').textContent = String(wish.value.length); });

    $$('input[name="attendance"]', form).forEach((r) => r.addEventListener('change', () => {
      $('#guests-field').hidden = r.value !== 'hadir' || !r.checked;
      setFieldError('err-attendance', null, '');
    }));
    $('#rsvp-name').addEventListener('input', () => setFieldError('err-name', $('#rsvp-name'), ''));

    form.addEventListener('submit', onSubmit);
    $('#thanks-again').addEventListener('click', () => {
      $('#rsvp-thanks').hidden = true;
      form.hidden = false;
      $('#rsvp-wish').value = '';
      $('#wish-count').textContent = '0';
      setStatus('');
      $('#rsvp-name').focus();
    });
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    if (submitBtn.disabled) return;

    const nameInput = $('#rsvp-name');
    const name = nameInput.value.replace(/\s+/g, ' ').trim();
    const checked = $('input[name="attendance"]:checked', form);
    const wishText = $('#rsvp-wish').value.trim();

    let bad = null;
    if (name.length < 2) { setFieldError('err-name', nameInput, 'Mohon isi nama Anda.'); bad = bad || nameInput; } else setFieldError('err-name', nameInput, '');
    if (!checked) { setFieldError('err-attendance', null, 'Mohon pilih salah satu.'); bad = bad || $('input[name="attendance"]', form); } else setFieldError('err-attendance', null, '');
    if (bad) { bad.focus(); setStatus(''); return; }

    const attendance = checked.value;
    const payload = {
      name,
      attendance,
      guests: attendance === 'hadir' ? parseInt($('#rsvp-guests').value, 10) || 1 : 0,
      wish: wishText,
      website: $('#rsvp-website').value
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Mengirim…';
    setStatus('');
    try {
      await api('POST', payload);
      showThanks(name, attendance);
      loadWishes();
    } catch (err) {
      if (err && err.code === 'validation' && err.fields) {
        if (err.fields.name) setFieldError('err-name', nameInput, err.fields.name);
        if (err.fields.attendance) setFieldError('err-attendance', null, err.fields.attendance);
        setStatus(err.fields.wish || err.fields.guests || 'Mohon periksa kembali isian Anda.', true);
      } else {
        setStatus(friendlyError(err), true);
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Kirim Konfirmasi';
    }
  }

  function showThanks(name, attendance) {
    form.hidden = true;
    $('#thanks-title').textContent = name;
    $('#thanks-text').textContent = attendance === 'hadir'
      ? 'Konfirmasi kehadiran Anda sudah kami terima. Sampai jumpa di hari bahagia kami!'
      : 'Terima kasih sudah memberi kabar. Doa dan ucapan Anda sangat berarti bagi kami.';
    const box = $('#rsvp-thanks');
    box.hidden = false;
    box.focus({ preventScroll: true });
    box.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  }

  /* ------------------------------------------------------------ buku tamu */

  const PAGE = 6;
  const listEl = $('#wishes');
  const moreBtn = $('#wishes-more');
  const refreshBtn = $('#wishes-refresh');
  let wishes = [];
  let shown = 0;
  let loading = false;

  const rtf = typeof Intl.RelativeTimeFormat === 'function' ? new Intl.RelativeTimeFormat('id', { numeric: 'auto' }) : null;
  function timeAgo(iso) {
    const t = Date.parse(iso);
    if (isNaN(t)) return '';
    const diff = (t - Date.now()) / 1000;
    const abs = Math.abs(diff);
    if (abs < 60) return 'baru saja';
    if (rtf) {
      if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
      if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
      if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day');
    }
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(t);
  }

  function wishCard(w) {
    const yes = w.attendance === 'hadir';
    return h('article', { class: 'wish', 'data-reveal': '' },
      h('header', { class: 'wish__head' },
        h('h3', { class: 'wish__name', text: w.name }),
        h('span', { class: 'badge ' + (yes ? 'badge--yes' : ''), text: yes ? 'Hadir' : 'Tidak hadir' })),
      h('p', { class: 'wish__text', text: w.wish }),
      w.at ? h('p', { class: 'wish__time', text: timeAgo(w.at) }) : null);
  }

  function skeleton() {
    listEl.textContent = '';
    for (let i = 0; i < 3; i++) {
      listEl.append(h('div', { class: 'wish wish--skeleton', 'aria-hidden': 'true' },
        h('span', { class: 'sk sk--lg' }), h('span', { class: 'sk sk--md' }), h('span', { class: 'sk sk--sm' })));
    }
    moreBtn.hidden = true;
    refreshBtn.hidden = true;
  }

  function renderMore() {
    const next = wishes.slice(shown, shown + PAGE);
    next.forEach((w) => { const el = wishCard(w); listEl.append(el); reveal(el); });
    shown += next.length;
    moreBtn.hidden = shown >= wishes.length;
  }

  function renderWishes() {
    listEl.textContent = '';
    shown = 0;
    const total = $('#wish-total');
    if (!wishes.length) {
      listEl.append(h('p', { class: 'wishes__empty', text: 'Belum ada ucapan. Jadilah yang pertama menuliskannya.' }));
      total.hidden = true;
      moreBtn.hidden = true;
    } else {
      total.textContent = wishes.length + ' ucapan telah masuk';
      total.hidden = false;
      renderMore();
    }
    refreshBtn.hidden = false;
  }

  function renderWishError(err) {
    listEl.textContent = '';
    listEl.append(h('div', { class: 'wishes__error' },
      h('p', { text: err && err.code === 'not_configured'
        ? 'Buku tamu belum terhubung ke penyimpanan. (Pemilik undangan: ikuti bagian “Backend RSVP” di README.)'
        : 'Ucapan belum dapat dimuat saat ini.' }),
      h('button', { type: 'button', class: 'btn btn--ghost', onclick: loadWishes }, 'Coba lagi')));
    moreBtn.hidden = true;
    refreshBtn.hidden = true;
  }

  async function loadWishes() {
    if (loading) return;
    loading = true;
    skeleton();
    try {
      const data = await api('GET');
      wishes = Array.isArray(data.wishes) ? data.wishes : [];
      renderWishes();
    } catch (err) {
      renderWishError(err);
    } finally {
      loading = false;
    }
  }

  function setupGuestbook() {
    moreBtn.addEventListener('click', renderMore);
    refreshBtn.addEventListener('click', loadWishes);
    const section = $('#guestbook');
    // Muat ucapan hanya saat bagian buku tamu hampir terlihat (hemat kuota server).
    if ('IntersectionObserver' in window) {
      const watcher = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { watcher.disconnect(); loadWishes(); }
      }, { rootMargin: '600px 0px' });
      watcher.observe(section);
    } else {
      loadWishes();
    }
  }

  /* ------------------------------------------------------------------ init */

  function init() {
    renderStatic();
    renderPeople();
    renderGallery();
    renderEvents();
    setupLightbox();
    setupCountdown();
    setupMusic();
    setupRsvp();
    setupGuestbook();
    $('#open-btn').addEventListener('click', openInvitation);
  }

  init();
})();
