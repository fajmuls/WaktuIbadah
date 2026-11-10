# Rencana Implementasi: Pembaruan Kalender Ibadah, Jadwal Rutin, Al-Qur'an, PWA & Admin Firestore (v2.12.0)

Rencana ini merombak pengalaman penjadwalan dan kalender ibadah agar bersih dan nyaman diakses di ponsel pintar, menyederhanakan bookmark Al-Qur'an sebagai penanda Hanca langsung, memperbaiki pewarnaan tajwid dan ligatur Arab, merapikan Web App Manifest untuk PWA Builder, serta memperbaiki sinkronisasi data Admin Dashboard dan penghapusan data Firestore.

---

### User Review & Critical Decisions

> [!IMPORTANT] Ringkasan Keputusan Pengguna (Hasil Klarifikasi):
> - **Gaya Indikator Kalender**: Warna latar dan aksen berbeda dengan ikon ringkas status ibadah fardhu (hijau lembut saat 5 waktu lengkap) dan aksen emas untuk Dhuha/sunnah.
> - **Model Penjadwalan Rutin**: Tombol cepat template rutin (Rutin Dhuha, Rutin Tilawah, Rutin Tahajud) ditambah opsi kustom berulang harian yang simpel dan mudah dibaca di HP.
> - **Pemicu Dialog Ulasan**: Otomatis muncul setelah 7 hari penggunaan aktif atau setelah hari pertama target salat fardhu tuntas lengkap. Input ulasan dibuat bebas mandiri (tanpa template teks kaku).

---

### 1. Overview & Core Concept

- **Apa yang Dibangun**: 
  1. **Visualisasi Kalender Ibadah**: Setiap kotak tanggal memiliki kode warna adaptif berdasarkan status ibadah (fardhu lengkap, parsial, atau ada sunnah seperti Dhuha/Tahajud) dilengkapi detail popup/drawer untuk melihat capaian hari tersebut.
  2. **PWA Manifest Compliant**: Penyesuaian `manifest.webmanifest` agar valid dan rapi saat diverifikasi oleh PWA Builder (id, scope, orientation, categories, full icons & safe maskable, shortcuts).
  3. **Penjadwalan Simpel & Rutin 1-Klik**: Redesain halaman Jadwal agar ergonomis di layar ponsel (anti button-overload), dengan tombol cepat template ibadah harian berulang (Dhuha, Tilawah, Tahajud) yang langsung sinkron ke Firestore.
  4. **Bookmark Al-Qur'an = Hanca Terakhir**: Tombol bookmark per ayat langsung menyimpan ayat tersebut sebagai "Hanca Terakhir Dibaca" (1-tap action) tanpa form berbelit-belit. Tombol favorit ayat juga dipermudah (1-tap star).
  5. **Tajwid Modular & Non-Destructive Ligatur**: Memperbaiki pemisahan kata pada parser tajwid agar huruf Arab tetap tersambung rapi. Tajwid secara default dinonaktifkan (`none`), dengan opsi pilihan di pengaturan: *Tanpa Tajwid (Default)*, *Tajwid Dasar*, dan *Tajwid Lengkap* (membedakan Idgham Bighunnah, Idgham Bilaghunnah, Ikhfa, Iqlab, Ghunnah, Qalqalah, Mad, Izhar).
  6. **Admin Dashboard & Firestore Management**: Menghubungkan data `student_profiles` dan `website_reviews` secara andal (mengatasi error "kode 200"), menyaring/membersihkan akun palsu, serta menyediakan aksi **Hapus Akun Pengguna** langsung dari Admin Dashboard ke Firestore.
  7. **Sistem Logout & Dialog Review Mandiri**: Fitur logout dengan dialog peringatan jika akun belum memiliki PIN pemulihan. Formulir ulasan website tanpa template bawaan agar responden mengisi kritik/saran otentik.
  8. **Pembaruan Versi v2.12.0**: Memperbarui nomor versi di Pengaturan, `storage.ts`, dan menambahkan catatan rilis serta saran teknis yang berguna bagi penguji proyek.

---

### 2. User Experience & Visual Design

#### A. Desain Kotak Tanggal Kalender (`MonthlyCalendarGrid` & `Kalender.tsx`)
- **Status Warna Kotak**:
  - *Fardhu Lengkap (5/5)*: Latar hijau pastel (`bg-emerald-50 dark:bg-emerald-950/40`), border emerald halus, dot hijau cerah.
  - *Parsial (1-4 fardhu)*: Latar netral dengan dot indikator jumlah salat.
  - *Ada Dhuha / Sunnah*: Aksen sudut emas/kuning cerah (`bg-amber-400/20` border `border-amber-400/50`) dengan ikon bintang/matahari mungil di pojok tanggal.
- **Drawer / Rincian Tanggal**: Mengetuk tanggal langsung membuka ringkasan rapi: Salat fardhu yang sudah diceklis, salat Dhuha & Tahajud, tilawah Al-Qur'an, dan jadwal kegiatan pada hari itu.

#### B. Redesain Halaman Jadwal (Mobile-Friendly & Ergonomis)
- **Zero-Clutter Header**: Mengurangi tombol ganda; navigasi tanggal dibuat dalam carousel geser 7 hari yang nyaman dijangkau jempol.
- **Kartu Template Rutin 1-Klik**:
  - `[ + Rutin Dhuha (08:30) ]`
  - `[ + Rutin Tilawah (18:30) ]`
  - `[ + Rutin Tahajud (03:30) ]`
- **Kartu Agenda yang Bersih**: Waktu mulai - selesai, tag kategori dengan warna lembut, status bentrok dengan waktu salat, dan aksi centang/hapus tanpa menu berlapis.

#### C. Pengalaman Membaca Al-Qur'an (Bookmark & Tajwid)
- **1-Tap Hanca Bookmark**: Ikon pita bookmark di setiap ayat langsung menyematkan ayat tersebut sebagai Hanca terakhir, memutar audio konfirmasi, dan menampilkan indikator aktif pada ayat tersebut.
- **1-Tap Favorit**: Ikon hati/bintang langsung menambahkan ayat ke daftar favorit pengguna.
- **Pewarnaan Tajwid Bersih**: Mencegah pemutusan sambungan kaligrafi Arab (menggunakan font LPMQ/Amiri dan styling span inline yang tidak merusak harakat/ligatur). Pengaturan tajwid di modal reader: Tanpa Tajwid (Default), Tajwid Dasar, Tajwid Lengkap.

---

### 3. Key Product Decisions & Trade-Offs

- **Sinkronisasi Admin Firestore (Dual Mode)**:
  - *Pendekatan*: Selain memanggil API route `/api/admin/overview`, Admin Dashboard memuat data langsung dari Firestore client SDK (`student_profiles` & `website_reviews`) secara otomatis jika serverless endpoint mengalami kendala. Ini memastikan dashboard selalu menampilkan pengguna asli secara real-time.
  - *Manajemen Data*: Admin memiliki kontrol menghapus akun dummy/palsu dari Firestore langsung dari UI dengan tombol hapus terproteksi konfirmasi.
- **Struktur Hanca Tunggal Utama vs Riwayat**:
  - Tombol bookmark pada ayat langsung memperbarui Hanca aktif utama. Riwayat bookmark tetap tersimpan di riwayat Hanca lokal dan Firestore agar data tidak hilang.
- **Ulasan Bebas Mandiri**:
  - Menghilangkan template ulasan otomatis agar input mahasiswa murni dan otentik untuk keperluan laporan pengujian proyek.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                 WaktuIbadah Client (React SPA)              │
├──────────────────────────────┬──────────────────────────────┤
│       Fitur Harian           │      Layanan Cloud & PWA     │
│ ┌──────────────────────────┐ │ ┌──────────────────────────┐ │
│ │ Kalender & Detail Ibadah │ │ │ manifest.webmanifest     │ │
│ │ (Warna Fardhu + Sunnah)  │ │ │ (PWA Builder Compliant)  │ │
│ └──────────────────────────┘ │ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │ ┌──────────────────────────┐ │
│ │ Jadwal & Template Rutin  │ │ │ Firestore Sync           │ │
│ │ (Dhuha, Tilawah, dsb.)   │ │ │ (student_profiles)       │ │
│ └──────────────────────────┘ │ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │ ┌──────────────────────────┐ │
│ │ Al-Qur'an: 1-Tap Hanca,  │ │ │ Admin Direct Delete &    │ │
│ │ Favorit, Tajwid Modular  │ │ │ website_reviews Sync     │ │
│ └──────────────────────────┘ │ └──────────────────────────┘ │
└──────────────────────────────┴──────────────────────────────┘
```

#### Komponen yang Diperbarui:
1. `public/manifest.webmanifest`: Pembenahan format manifest lengkap (standar PWA Builder).
2. `src/components/MonthlyCalendarGrid.tsx`: Indikator warna latar box tanggal (fardhu lengkap, parsial, aksen sunnah/dhuha, icon badge).
3. `src/pages/Kalender.tsx`: Penyatuan kalender hijriah dengan catatan ibadah fardhu & sunnah harian, plus drawer detail hari.
4. `src/pages/Jadwal.tsx`: Penyederhanaan UI jadwal di HP + tombol cepat template rutin harian (Dhuha, Tilawah, Tahajud) yang tersinkron ke cloud.
5. `src/pages/QuranHadis.tsx`: Bookmark 1-klik sebagai Hanca terakhir, penyederhanaan favorit ayat, integrasi mode tajwid (none/dasar/lengkap).
6. `src/lib/tajweed.ts`: Penyempurnaan regex tajwid dan pelestarian sambungan huruf Arab, dengan opsi level aturan tajwid.
7. `src/pages/AdminDashboard.tsx` & `src/components/AdminUsersPanel.tsx`: Perbaikan koneksi Firestore, fitur hapus akun langsung dari dashboard, pembersihan filter dummy.
8. `src/components/WebsiteReviewModal.tsx`: Pemicu otomatis (7 hari aktif / 5 fardhu lengkap), form komentar bebas tanpa teks template.
9. `src/pages/Settings.tsx` & `src/lib/storage.ts`: Tombol Logout dengan peringatan PIN, pembaruan versi ke v2.12.0 beserta catatan rilis dan rekomendasi pengembang.
