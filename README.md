# GenSoal

Generator soal Higher Order Thinking Skills (HOTS) berbasis Kurikulum Merdeka untuk guru SMA/SMK di daerah 3T.

![Tampilan GenSoal](assets/logo.svg)

## Apa itu GenSoal?

GenSoal adalah aplikasi web yang membantu guru menyusun soal HOTS (level C4 analisis, C5 evaluasi, C6 mencipta) sesuai Capaian Pembelajaran Kurikulum Merdeka. Guru cukup mengisi mata pelajaran, kelas, dan topik materi, lalu aplikasi menyusun soal lengkap dengan kunci jawaban dan rubrik penilaian. Hasilnya bisa langsung dicetak atau diunduh dalam format Word.

Aplikasi berjalan sepenuhnya di browser, tanpa server, tanpa akun, dan bisa dipakai tanpa internet setelah dibuka sekali.

## Masalah yang Diselesaikan

Guru di daerah terdepan, terluar, dan tertinggal (3T) menghadapi beberapa kesulitan nyata:

- Menyusun soal HOTS butuh waktu lama karena harus memikirkan stimulus, konteks, dan pengecoh yang tepat.
- Referensi bank soal HOTS terbatas, sementara internet dan listrik sering tidak stabil.
- Kalau kehabisan waktu, guru cenderung kembali ke soal hafalan (C1 sampai C2) yang tidak mengukur kemampuan berpikir tingkat tinggi.
- Tidak ada alat bantu yang gratis, ringan, dan bisa dipakai tanpa koneksi.

GenSoal menutup celah itu: satu alat yang bisa dibuka di laptop atau HP sederhana, tanpa biaya, dan tetap jalan saat offline.

## Fitur Utama

| Fitur | Keterangan |
|---|---|
| Masuk tanpa kata sandi | Cukup isi nama guru dan asal sekolah |
| Buat soal HOTS | Pilih mapel, kelas, topik, level C4/C5/C6, bentuk soal, dan jumlah 1 sampai 50 |
| Template sadar mapel | Setiap mata pelajaran punya kalimat soal sendiri yang cocok dengan karakter materinya |
| Kelas terpisah | Pilih kelas X, XI, XII, atau VII-IX (SMP). Fase Kurikulum Merdeka terisi otomatis |
| Kunci dan rubrik | Setiap soal dilengkapi kunci jawaban dan rubrik penilaian |
| Pratinjau | Lihat soal sebelum disimpan atau dicetak |
| Cetak bersih | Lembar soal tanpa kunci dan tanpa tanda aplikasi, siap dibagikan ke siswa |
| Unduh Word | Ekspor soal ke berkas .doc, dengan atau tanpa kunci |
| Bank soal | Simpan, cari, dan buka kembali soal yang pernah dibuat |
| Mode gelap | Tema terang dan gelap, pilihan tersimpan otomatis |
| Offline | Berjalan tanpa internet setelah pertama kali dibuka (Service Worker) |
| Aksesibel | Navigasi papan tombol, peran ARIA, dan dukungan pembaca layar |

## Mata Pelajaran yang Didukung

Bahasa Indonesia, Matematika, Fisika, Biologi, Sejarah, Sosiologi, Ekonomi, dan Geografi.

Setiap mapel memiliki 15 template soal: 5 untuk C4, 5 untuk C5, dan 5 untuk C6.

## Cara Mencoba

### Cara cepat (tanpa instalasi)

1. Unduh atau klon repository ini.
2. Buka berkas `index.html` di browser Chrome, Edge, atau Firefox.

Dengan cara ini aplikasi langsung berjalan, tetapi mode offline dan pemuatan template dari berkas JSON tidak aktif.

### Cara lengkap (disarankan)

Jalankan server lokal sederhana dari folder proyek:

```
python -m http.server 8000
```

Lalu buka `http://localhost:8000` di browser.

Cara ini mengaktifkan semua fitur: template dari `templates.json` dan mode offline lewat Service Worker.

> Catatan: `fetch` dan Service Worker hanya berjalan di protokol http atau https, bukan `file://`. Itulah alasan versi lengkap perlu server lokal.

### Cara pakai singkat

1. Isi nama dan asal sekolah, lalu klik Masuk.
2. Buka menu Buat Soal.
3. Pilih mata pelajaran, kelas, tulis materi atau capaian pembelajaran, pilih level dan bentuk soal, atur jumlah soal.
4. Klik Buat Soal.
5. Periksa pratinjau, lalu cetak, unduh Word, atau simpan ke Bank Soal.

## Struktur Proyek

```
Aplikasi_Prototipe/
├── index.html        # Halaman utama, memuat modul aplikasi
├── styles.css        # Seluruh gaya, termasuk mode gelap dan gaya cetak
├── utils.js          # Konstanta, helper, validasi, dan fungsi format
├── store.js          # Manajemen state dan penyimpanan localStorage
├── app.js            # Routing, render halaman, dan pengikatan event
├── print.js          # Membangun lembar soal, cetak, dan ekspor Word
├── templates.json    # Template soal per mapel dan level C4, C5, C6
├── sw.js             # Service Worker untuk mode offline
├── manifest.json     # Manifest aplikasi web progresif (PWA)
├── assets/
│   └── logo.svg      # Logo aplikasi
├── wireframe.html    # Rancangan antarmuka awal
├── README.md         # Berkas ini
├── CARA_PUSH_GITHUB.txt  # Panduan mengunggah proyek ke GitHub
├── LICENSE           # Lisensi MIT
└── .gitignore        # Berkas yang diabaikan Git
```

## Teknologi

- HTML5 dan CSS3
- JavaScript modern dengan ES modules, tanpa framework dan tanpa build tool
- `localStorage` untuk penyimpanan data di perangkat
- Service Worker dan Web App Manifest untuk dukungan offline dan PWA

Tidak ada backend, tidak ada basis data, tidak ada proses build. Cukup berkas statis.

## Privasi

Semua data guru dan soal disimpan di perangkat pengguna melalui `localStorage`. Tidak ada data yang dikirim ke server mana pun dan tidak ada pelacakan.

## Cara Berkontribusi

Proyek ini terbuka untuk masukan, terutama penambahan template soal untuk mata pelajaran lain atau perbaikan kalimat soal agar lebih sesuai praktik di kelas. Silakan buat issue atau kirim pull request.

## Lisensi

Dirilis di bawah [MIT License](LICENSE).

## Pembuat

Dibuat sebagai tugas mata kuliah Manajemen Proyek Informatika, Program Studi Informatika, Semester 7.

- Nama: Rafi
- Tahun: 2026
