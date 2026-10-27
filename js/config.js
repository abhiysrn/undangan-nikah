/* ==========================================================================
   DATA UNDANGAN — file inilah yang perlu Anda edit.
   Semua nama, tanggal, lokasi, foto, musik, dan teks undangan ada di sini.
   Setelah mengubah, simpan (commit) file ini di GitHub; Vercel akan
   memperbarui website secara otomatis.

   Aturan penulisan:
   - Teks ditulis di antara tanda kutip '...' dan jangan menghapus koma di akhir baris.
   - Tanggal memakai format ISO: 'TAHUN-BULAN-TANGGALTJAM:MENIT:DETIK+ZONA'
     Contoh 16 Januari 2027 pukul 09.00 WITA  ->  '2027-01-16T09:00:00+08:00'
     (WIB = +07:00, WITA = +08:00, WIT = +09:00)
   ========================================================================== */

window.INVITATION = {

  /* ---------- Judul tab browser & deskripsi ---------- */
  meta: {
 title: 'Icha & Friendly — Undangan Pernikahan',
description: 'Dengan penuh sukacita, Icha & Friendly mengundang Anda untuk hadir di hari pernikahan kami.'
  },

  /* ---------- Mempelai ----------
     Urutan di sini = urutan tampil di seluruh halaman.
     nickname  : nama panggilan (dipakai pada judul besar)
     photo     : foto potret, rasio ideal 4:5 (mis. 900 x 1125 px)
     instagram : username tanpa @ (kosongkan '' bila tidak ingin ditampilkan) */
  couple: {
  people: [
    {
      role: 'Mempelai Wanita',
      nickname: 'Icha',
      fullName: 'Aisyah Valyana Saputri',
      parents: 'Putri dari Bapak Muhammad Maksum (Alm.) & Ibu Eni Suryani',
      photo: 'assets/photos/bride.jpg',
      instagram: ''
    },
    {
      role: 'Mempelai Pria',
      nickname: 'Friendly',
      fullName: 'Friendly Septiano Saputra',
    parents: 'Putra dari Bapak Ramli Majid (Alm.) & Ibu Sri Wahyuni (Almh.)',
      photo: 'assets/photos/groom.jpg',
      instagram: ''
    }
  ]
},

  /* ---------- Acara ----------
     timezone       : zona waktu IANA untuk menampilkan jam (Asia/Jakarta, Asia/Makassar, Asia/Jayapura)
     timezoneLabel  : label singkat yang tampil di samping jam (WIB / WITA / WIT)
     countdownTo    : target hitung mundur. Bila dikosongkan, dipakai jam mulai acara pertama.
     items          : daftar acara. Tambah/hapus blok { ... } sesuai kebutuhan.
       start / end  : waktu mulai & selesai (format ISO, lihat di atas)
       mapsUrl      : (opsional) tempel link Google Maps hasil "Bagikan" dari aplikasi Maps.
                      Bila kosong, tombol memakai pencarian Google Maps dari nama venue + alamat. */
  event: {
  timezone: 'Asia/Jakarta',
  timezoneLabel: 'WIB',
  countdownTo: '',
  note: 'Mohon hadir tepat waktu untuk mengikuti rangkaian acara pernikahan.',
  items: [
    {
      id: 'akad',
      title: 'Akad Nikah',
      start: '2026-10-30T09:00:00+07:00',
      end: '2026-10-30T10:30:00+07:00',
      venue: 'KUA DAU',
      address: 'KUA Dau, Kabupaten Malang, Jawa Timur',
      mapsUrl: 'https://maps.app.goo.gl/cgzLhaCRWEA9NDdS6?g_st=ic'
    },
    {
      id: 'resepsi',
      title: 'Resepsi',
      start: '2026-10-30T16:00:00+07:00',
      end: '2026-10-30T23:59:00+07:00',
      venue: 'BRUNO AGUSTO HEADQUARTER',
      address: '3H87+8J9, Jl. Raya Sempu, Sempu, Gadingkulon, Kec. Dau, Kabupaten Malang, Jawa Timur 65151',
      mapsUrl: 'https://maps.app.goo.gl/h5xfBX2uDR3CWrJg7?g_st=iw'
    }
  ]
},
  /* ---------- Foto ----------
     Ganti file di folder assets/photos/ dengan foto Anda (nama file boleh tetap sama),
     atau ubah alamat file di bawah ini.
     cover     : foto pada layar pembuka (potret, rasio ideal 4:5)
     hero      : foto besar pembuka halaman undangan (potret, subjek di tengah-atas)
     heroFocus : titik fokus pemotongan foto hero, mis. '50% 30%' (kiri-kanan, atas-bawah)
     gallery   : daftar foto galeri. ratio = bentuk kotak foto ('3/4', '4/5', '1/1', '4/3'). */
  photos: {
    cover: 'assets/photos/cover.jpg',
    hero: 'assets/photos/hero.jpg',
    heroFocus: '50% 30%',
    gallery: [
      { src: 'assets/photos/gallery-1.jpg', alt: 'Foto prewedding 1', ratio: '3/4' },
      { src: 'assets/photos/gallery-2.jpg', alt: 'Foto prewedding 2', ratio: '1/1' },
      { src: 'assets/photos/gallery-3.jpg', alt: 'Foto prewedding 3', ratio: '4/5' },
      { src: 'assets/photos/gallery-4.jpg', alt: 'Foto prewedding 4', ratio: '4/3' },
      { src: 'assets/photos/gallery-5.jpg', alt: 'Foto prewedding 5', ratio: '3/4' },
      { src: 'assets/photos/gallery-6.jpg', alt: 'Foto prewedding 6', ratio: '4/5' }
    ]
  },

  /* ---------- Musik latar ----------
     File bawaan hanyalah musik contoh buatan sendiri (bebas hak cipta).
     Ganti dengan lagu pilihan Anda yang punya lisensi, simpan di assets/music/.
     Format terbaik: .mp3 (ukuran ideal di bawah 3 MB).
     Kosongkan src: '' bila tidak ingin memakai musik (tombol musik otomatis hilang). */
  music: {
    src: 'assets/music/background.mp3',
    volume: 0.6,
    loop: true
  },

  /* ---------- RSVP & buku tamu ----------
     endpoint     : jangan diubah (fungsi server di folder api/)
     maxGuests    : jumlah tamu maksimal per konfirmasi
     maxWishLength: panjang ucapan maksimal (karakter) */
  rsvp: {
    endpoint: '/api/rsvp',
    maxGuests: 5,
    maxWishLength: 300
  },

  /* ---------- Teks ---------- */
  texts: {
    greeting: 'Dengan memohon rahmat dan ridho Allah SWT',
    intro: 'Kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada hari pernikahan kami.',
    quote: 'Menikah bukan tentang menemukan seseorang yang sempurna, melainkan tentang tumbuh bersama seseorang yang tepat.',
    quoteSource: '',
    countdownDone: 'Hari bahagia telah tiba.',
    closing: 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu. Terima kasih.'
  }
};
