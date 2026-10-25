# Website Undangan Pernikahan

Undangan digital bergaya editorial minimalis: mobile-first, tanpa proses build, dan siap
di-deploy lewat **GitHub + Vercel**. RSVP dan buku tamu tersimpan sungguhan di **Google Sheets**.

**Fitur:** layar pembuka + transisi · profil mempelai · galeri + lightbox · hitung mundur ·
info akad & resepsi · tombol Google Maps · simpan ke kalender · musik latar (mulai setelah
tombol "Buka Undangan" diklik) · RSVP · buku tamu persisten · link personal per tamu.

---

## 1. Struktur project

```
wedding-invitation/
├── index.html              Struktur halaman + tag pratinjau link (OG)
├── css/
│   └── style.css           Tampilan (warna, tipografi, animasi)
├── js/
│   ├── config.js           ★ DATA UNDANGAN — satu-satunya file yang rutin Anda edit
│   └── app.js              Logika (tidak perlu diedit)
├── api/
│   └── rsvp.js             Fungsi server Vercel: penghubung ke Google Sheets
├── apps-script/
│   └── Code.gs             Kode untuk ditempel ke Google Apps Script (bukan untuk Vercel)
├── assets/
│   ├── favicon.svg
│   ├── photos/             Foto (placeholder — ganti dengan foto Anda)
│   └── music/background.mp3  Musik contoh (ganti dengan lagu berlisensi)
├── vercel.json             Header keamanan
├── package.json
└── README.md
```

Cara kerja RSVP:

```
Tamu → website → /api/rsvp (Vercel) → Google Apps Script → Google Sheet milik Anda
```

URL Apps Script dan kunci rahasianya hanya ada di *Environment Variables* Vercel,
**tidak pernah** ada di kode frontend maupun di GitHub.

---

## 2. Mengganti data undangan

Buka **`js/config.js`** — semua nama, tanggal, lokasi, foto, musik, dan teks ada di sana,
lengkap dengan petunjuk di setiap bagian.

| Yang ingin diganti | Di mana |
|---|---|
| Nama, orang tua, Instagram | `couple.people` di `js/config.js` |
| Tanggal & jam akad/resepsi | `event.items[].start` / `end` (format `2027-01-16T09:00:00+08:00`) |
| Nama venue, alamat, Google Maps | `event.items[].venue`, `address`, `mapsUrl` |
| Zona waktu (WIB/WITA/WIT) | `event.timezone` & `event.timezoneLabel` |
| Foto | ganti file di `assets/photos/` (nama file sama) atau ubah `photos` |
| Musik | ganti `assets/music/background.mp3` atau ubah `music.src` |
| Kalimat pembuka/penutup | `texts` |
| Jumlah tamu maksimal | `rsvp.maxGuests` |

**Foto.** Gunakan JPG, sisi terpanjang ±1200–1600 px, ukuran per file di bawah ±400 KB
(kompres lewat squoosh.app agar cepat dibuka di ponsel). Rasio ideal: `cover`, `hero`,
`bride`, `groom` = potret 4:5; galeri bebas (atur `ratio`). Foto `hero` dipotong mengikuti
layar; atur `heroFocus` (mis. `'50% 25%'`) agar wajah tidak terpotong.

**Musik.** File bawaan hanyalah musik contoh buatan sendiri (bebas hak cipta). Bila memakai
lagu populer, pastikan Anda berhak memakainya. Format `.mp3`, idealnya di bawah 3 MB.
Musik **tidak** berbunyi otomatis — browser memang memblokirnya; musik baru mulai ketika
tamu menekan **Buka Undangan**, lalu bisa dijeda lewat tombol bulat di kanan bawah.

**Pratinjau saat link dibagikan (WhatsApp).** Crawler WhatsApp tidak menjalankan JavaScript,
jadi bagian ini diedit di `index.html` (bagian `<head>`): `<title>`, `og:title`,
`og:description`, dan **`og:image`** — ganti `GANTI-DOMAIN-ANDA.vercel.app` dengan domain
Vercel Anda dan ganti `assets/photos/og.jpg` (ideal 1200×630 px, JPG/PNG) dengan foto Anda.

**Mesin pencari.** Halaman memakai `noindex` karena undangan bersifat pribadi.

---

## 3. Backend RSVP (Google Sheets) — sekali saja

Bagian ini bisa dikerjakan sebelum atau sesudah deploy. RSVP baru berfungsi setelah bagian ini
selesai **dan** Environment Variables di Vercel terisi (bagian 4.2, langkah 4).

1. Buka [sheets.google.com](https://sheets.google.com) → buat spreadsheet kosong, mis. **"RSVP Undangan"**.
2. Menu **Extensions → Apps Script**. Hapus kode bawaan, lalu tempel seluruh isi
   `apps-script/Code.gs`. Klik ikon simpan.
3. Klik ikon **roda gigi (Project Settings)** → bagian **Script Properties** → **Add script property**:
   - Property: `SECRET`
   - Value: teks acak yang panjang (minimal 32 karakter, huruf+angka), mis. hasil ketikan acak
     atau dari pembuat kata sandi. **Catat** — dipakai lagi di Vercel.
4. Kembali ke editor, pilih fungsi **`setup`** di dropdown, klik **Run**. Setujui izin akses
   (pilih akun → *Advanced* → *Go to … (unsafe)* → *Allow*; ini normal untuk skrip milik sendiri).
   Tab **RSVP** dengan judul kolom akan muncul di spreadsheet.
5. Klik **Deploy → New deployment** → ikon roda gigi → **Web app**:
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**
   - klik **Deploy**, lalu **salin Web app URL** (berakhiran `/exec`).

> "Anyone" aman di sini karena setiap permintaan wajib membawa `SECRET` dan URL-nya hanya
> disimpan di server Vercel. Akun Google Workspace kantor/sekolah kadang melarang opsi
> "Anyone" — gunakan akun Gmail pribadi bila itu terjadi.
>
> Bila suatu hari Anda mengubah `Code.gs`, buat versi baru: **Deploy → Manage deployments →
> ikon pensil → Version: New version → Deploy**. URL tetap sama.

Data yang masuk muncul langsung di tab **RSVP** (waktu, nama, kehadiran, jumlah tamu, ucapan).
Anda bisa mengunduhnya lewat **File → Download → CSV**. Hanya tamu yang menulis ucapan yang
ditampilkan di buku tamu; nomor/jumlah tamu tidak ditampilkan ke publik.

---

## 4. Deploy: GitHub (lewat browser) → Vercel

### 4.1 Unggah ke GitHub tanpa terminal

1. Buat akun di [github.com](https://github.com) bila belum punya.
2. Klik **+** (kanan atas) → **New repository**. Beri nama, mis. `undangan-kami`.
   Pilih **Private** (disarankan), lalu **Create repository**.
3. Di halaman repository kosong, klik link **uploading an existing file**.
4. Di komputer, **ekstrak** file ZIP project. Buka foldernya sampai terlihat `index.html`,
   `css`, `js`, `api`, dst. **Pilih semua isinya** (Ctrl+A / ⌘A) dan **seret** ke halaman GitHub.
   - Gunakan **Chrome, Edge, atau Firefox** agar folder ikut terunggah beserta strukturnya.
   - Pastikan `index.html` berada **langsung di akar repository**, bukan di dalam folder lagi.
5. Tunggu semua file selesai diunggah (22 file), isi pesan, mis. "Upload undangan",
   lalu klik **Commit changes**.

**Memperbarui kemudian:** buka file di GitHub (mis. `js/config.js`) → ikon **pensil** → edit →
**Commit changes**. Untuk mengganti foto/musik: buka foldernya → **Add file → Upload files**
(nama file yang sama akan menimpa yang lama). Vercel otomatis men-deploy ulang tiap ada perubahan.

> Tidak bisa menyeret folder? Alternatif: **Add file → Create new file**, ketik nama file dengan
> garis miring untuk membuat folder (mis. `api/rsvp.js`), tempel isinya. Untuk file biner
> (`.jpg`, `.mp3`) gunakan **Upload files** pada folder yang sesuai.

### 4.2 Hubungkan ke Vercel

1. Buka [vercel.com](https://vercel.com) → **Sign Up → Continue with GitHub**.
2. **Add New… → Project** → pilih repository undangan → **Import**.
3. Pengaturan: **Framework Preset = Other**; Build Command, Output Directory, Install Command
   **dibiarkan kosong**; Root Directory `./`.
4. Buka bagian **Environment Variables** dan tambahkan:

   | Name | Value |
   |---|---|
   | `APPS_SCRIPT_URL` | URL Web App Apps Script (berakhiran `/exec`) |
   | `APPS_SCRIPT_SECRET` | nilai yang sama persis dengan `SECRET` di Apps Script |
   | `MAX_GUESTS` | *(opsional)* batas jumlah tamu di server, bawaan 10 |

5. Klik **Deploy**. Setelah selesai, Anda mendapat alamat `https://nama-project.vercel.app`.
6. Bila menambah/mengubah Environment Variables **setelah** deploy: **Deployments → … → Redeploy**.
7. Ganti `GANTI-DOMAIN-ANDA` di `og:image` (`index.html`) dengan alamat tersebut.
   Domain sendiri bisa dipasang di **Settings → Domains**.

---

## 5. Menguji, terutama di ponsel

1. Buka alamat Vercel di ponsel (atau pindai QR dari alamat itu — banyak pembuat QR gratis).
2. Tekan **Buka Undangan**: layar naik, musik mulai, tombol musik muncul di kanan bawah.
3. Kirim RSVP uji coba → muncul pesan terima kasih → cek baris baru di Google Sheet →
   ucapan tampil di bagian **Buku Tamu**. Hapus baris uji coba dari sheet setelahnya.
4. Cek **countdown**, tombol **Google Maps**, **Simpan ke kalender**, dan galeri (ketuk foto,
   geser kiri/kanan).

Bila RSVP belum terhubung, website tetap tampil dan memberi pesan jelas
("Penyimpanan RSVP belum dihubungkan") — tidak pernah berpura-pura berhasil menyimpan.

---

## 6. Link personal untuk tiap tamu

Tambahkan `?to=Nama+Tamu` pada alamat undangan:

```
https://nama-project.vercel.app/?to=Bapak+Budi+%26+Keluarga
```

Nama tampil di layar pembuka dan otomatis terisi di formulir RSVP. Untuk banyak tamu sekaligus,
tulis nama di kolom A Google Sheet, lalu di B2 isi rumus berikut dan seret ke bawah:

```
="https://nama-project.vercel.app/?to="&ENCODEURL(A2)
```

---

## 7. Keamanan & privasi

- Tidak ada API key/secret di kode frontend atau di repository. Rahasia hanya di Environment Variables Vercel
  dan Script Properties Apps Script.
- Server memvalidasi semua isian, membatasi panjang, menolak permintaan lintas-situs,
  membatasi frekuensi kiriman per alamat IP, dan memiliki kolom jebakan untuk bot.
- Isi spreadsheet disimpan sebagai teks sehingga tidak bisa dijalankan sebagai rumus.
- Ucapan tamu ditampilkan sebagai teks biasa (bukan HTML), sehingga aman dari penyisipan skrip.
- Repository **Private** tetap bisa di-deploy Vercel; website-nya sendiri tetap dapat dibuka
  siapa pun yang punya link.

---

## 8. Pemecahan masalah

| Gejala | Penyebab & solusi |
|---|---|
| "Penyimpanan RSVP belum dihubungkan" | `APPS_SCRIPT_URL` / `APPS_SCRIPT_SECRET` belum diisi di Vercel, atau belum **Redeploy** setelah mengisinya. |
| "Belum berhasil terkirim" / buku tamu gagal dimuat | Pastikan *Who has access* = **Anyone**, URL berakhiran `/exec`, dan `SECRET` di Apps Script sama persis dengan `APPS_SCRIPT_SECRET`. Lihat log di Vercel: **Project → Logs**. |
| Ubah `Code.gs` tapi tidak berefek | Perlu **New version** pada deployment (lihat bagian 3). |
| Musik tidak terdengar | Cek volume/silent-switch ponsel; tekan tombol musik. Pastikan `assets/music/background.mp3` ada. |
| Foto tidak berubah setelah diganti | Muat ulang paksa (Ctrl+Shift+R) atau tunggu beberapa menit hingga deploy Vercel selesai. |
| Pratinjau WhatsApp lama/kosong | `og:image` harus alamat lengkap (`https://…`) dan file-nya ada. WhatsApp menyimpan cache; uji dengan menambah `?v=2` di link. |
| Waktu acara salah satu jam | Periksa offset zona waktu pada `start`/`end` (WIB `+07:00`, WITA `+08:00`, WIT `+09:00`). |

---

## 9. (Opsional) Menjalankan di komputer sendiri

Hanya bila Anda nyaman memakai terminal. Dengan Node.js terpasang, jalankan `npx vercel dev`
di folder project (perlu login Vercel; Environment Variables bisa ditaruh di file `.env.local`
— jangan di-upload ke GitHub). Tanpa itu, `index.html` tetap bisa dibuka lewat server statis
apa pun, tetapi RSVP/buku tamu butuh fungsi `api/`.

---

Dibuat dengan HTML, CSS, dan JavaScript biasa. Font: Cormorant Garamond & Inter (Google Fonts, lisensi OFL).
