# Rencana Peningkatan WaktuIbadah v2.11.0: Kalender Bulanan Asli, Checklist Salat Home, Manajemen PIN Admin, & Notifikasi Handal

Rencana pembaruan komprehensif untuk menyempurnakan logika fitur, sinkronisasi salat, kalender bulanan penuh, panel admin, koleksi doa, serta kehandalan audio azan dan notifikasi.

---

## Ringkasan Konfirmasi Pengguna

> [!IMPORTANT]
> Berdasarkan tanya jawab di Tahap 1, keputusan fitur berikut telah dikonfirmasi:
> 1. **Tampilan Kalender Jadwal & Ibadah**: Grid kalender bulanan penuh dengan header kolom 7 hari (Ahad, Senin, Selasa, Rabu, Kamis, Jumat, Sabtu) dengan navigasi bulan (sebelumnya/berikutnya) seperti kalender asli.
> 2. **Checklist Salat di Dashboard (Home)**: 5 kartu horizontal ringkas tepat di bawah jadwal salat, tersinkronisasi dua arah dengan data tab Ibadah, dan mengunci salat yang waktunya belum tiba.
> 3. **Panel Admin Akun Pengguna**: Tabel daftar akun mahasiswa dengan kolom Nama Pengguna, Waktu Terdaftar/Diperbarui, dan PIN Keamanan 4 digit untuk membantu pemulihan akun saat mahasiswa lupa PIN.

---

## 1. Konsep & Alur Pengguna

```
┌────────────────────────────────────────────────────────────────────────┐
│                          DASHBOARD (HOME)                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Waktu Salat Berikutnya & Hitung Mundur (Hero Card)               │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ 5 KARTU HORIZONTAL CHECKLIST SALAT (SINKRON DENGAN TAB IBADAH)   │  │
│  │ [Subuh: Selesai ✓] [Zuhur: ✓] [Asar: Waktu Belum Tiba 🔒] ...     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  TAB JADWAL & TAB IBADAH (KALENDER ASLI)               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ < November 2026 >                     [ Hari Ini ] [ Mode Grid ] │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  Ahad  │ Senin │ Selasa │  Rabu │ Kamis │ Jumat │ Sabtu          │  │
│  │   1    │   2   │   3    │   4   │   5   │   6   │   7            │  │
│  │   8    │   9   │  [10]  │  11🔒 │  12🔒 │  13🔒 │  14🔒          │  │
│  │  ...   │  ...  │  ...   │  ...  │  ...  │  ...  │  ...           │  │
│  │ (Tanggal masa depan dapat dilihat, namun tidak dapat diceklis)   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   PANEL ADMIN (STUDENT PROFILES & PIN)                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Tabel Pengguna Terdaftar:                                        │  │
│  │ Nama Mahasiswa      │ Terdaftar      │ PIN Keamanan │ Aksi       │  │
│  │ Achmad Fauzan       │ 07 Nov 2026    │ 1234         │ Salin/Bantu│  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Rincian Pembaruan Fitur & Logika

### A. Checklist Salat 5 Waktu di Dashboard (Home)
- Menambahkan section **Checklist Salat Hari Ini** tepat di bawah kartu waktu salat.
- Desain 5 kartu ringkas dengan border tipis 1.5px Memphis style (`Subuh`, `Zuhur/Jumat`, `Asar`, `Magrib`, `Isya`).
- Menampilkan status ikon centang hijau jika sudah salat, atau tombol centang interaktif jika waktu telah masuk.
- Jika waktu salat belum tiba (atau tanggal mendatang), tombol otomatis berstatus terkunci (`Waktu belum tiba 🔒`) dengan umpan balik toast lembut.
- Perubahan status di Home otomatis tersinkronisasi seketika ke tab **Ibadah**, IndexedDB, dan Firestore cloud.

### B. Grid Kalender Bulanan Penuh (Ahad - Sabtu) di Jadwal & Ibadah
- Menggantikan baris geser sempit dengan **Komponen Kalender Bulanan Asli** (`MonthlyCalendarGrid`):
  - Header hari: **Ahad**, **Senin**, **Selasa**, **Rabu**, **Kamis**, **Jumat**, **Sabtu**.
  - Menampilkan hari-hari dari tanggal 1 sampai akhir bulan (28/30/31 hari), lengkap dengan sel offset awal bulan.
  - Tombol navigasi bulan: `◀ Bulan Sebelumnya` dan `Bulan Selanjutnya ▶`, serta tombol cepat `Hari Ini`.
  - Indikator visual tanggal hari ini (sorotan hijau toska) dan tanggal terpilih (Memphis kuning/aksen).
  - Indikator kecil di tiap sel tanggal: titik status salat fardhu lengkap atau jumlah agenda kuliah.
  - **Proteksi Cerdas Masa Depan**: Pengguna dapat melihat tanggal dan bulan yang akan datang, namun aksi ceklis salat pada tanggal di masa depan diblokir dengan pesan informatif.

### C. Panel Admin: Tampilan Akun Mahasiswa & Pemulihan PIN
- Di halaman **Admin Dashboard**, menambahkan tab/bagian **Daftar Mahasiswa & Akun Cloud**.
- Menampilkan tabel terstruktur berisi:
  - **Nama Mahasiswa**: Nama profil akun.
  - **Waktu Terdaftar / Terakhir Sinkron**: Format tanggal & jam Indonesia.
  - **PIN Keamanan 4 Digit**: Ditampilkan jelas dengan tombol salin cepat agar Admin dapat membantu mahasiswa yang lupa PIN perangkat.
  - **Status Data**: Indikator ringkas kelengkapan data (jadwal, tugas, log ibadah).

### D. Perbaikan Notifikasi, Web Push & Audio Azan Otomatis
- **Audio Azan Andalan**: Memperbarui pemutar azan di `audio.ts` dan Service Worker agar menggunakan aset audio lokal prioritas (`/audio/azan-subuh.mp3` dan `/audio/azan-fardhu.mp3`) dan fallback CDN terverifikasi.
- **Tombol Heningkan Azan**: Memastikan sinyal `SILENCE_AZAN` dari Service Worker memanggil `stopAlarmSound()` secara real-time pada seluruh jendela aktif.
- **Checklist Notifikasi Terupdate**: Pada aksi "Sudah Salat" di push notification, Service Worker menyimpan log ke IndexedDB, mem-broadcast event `CONFIRM_PRAYER_SILENT`, dan menampilkan notifikasi konfirmasi di sistem:
  *"Salat [Nama] Telah Dicatat ✅ - Alhamdulillah, catatan ibadah Anda berhasil diperbarui."*
- **Penanganan Keterlambatan Notifikasi (Timing Drift)**: Mengoptimalkan interval sinkronisasi background worker dan verifikasi jam perangkat agar toleransi pemicu waktu salat tepat pada menitnya.

### E. Perbaikan Doa, Wirid, & Tampilan Al-Qur'an
- **Eliminasi Angka Ganda pada Wirid**: Memperbaiki judul wirid di `prayers-data.ts` (misal dari `"1. Istighfar"` menjadi `"Istighfar"`) agar tidak bertumpukan dengan lencana bintang nomor ornamen Islam (`IslamicStarBadge`).
- **Penambahan Doa Harian Terlengkap**: Memperkaya koleksi doa harian dari pustaka doa terpercaya (doa bangun tidur, sebelum/sesudah makan, keluar rumah, masuk masjid, doa kemudahan belajar/ujian, doa kedua orang tua, dsb.).
- **Perapian Spasi Ayat Al-Qur'an**: Mengurangi jeda vertikal yang berlebih pada kartu ayat di layar ponsel agar nyaman dibaca tanpa banyak scroll kosong.
- **Optimasi Kecepatan Animasi**: Mempercepat durasi transisi Motion (`0.15s - 0.2s`) agar aplikasi terasa ringan dan responsif instan.

### F. Panduan Lengkap Konversi Website ke Aplikasi (PWA & APK/TWA)
- Menyertakan panduan langkah-demi-langkah bagi pengembang/penguji untuk mengemas proyek ini menjadi aplikasi ponsel (Android APK via Bubblewrap/TWA dan instalasi instan PWA di iOS & Desktop) untuk kebutuhan pengumpulan proyek/skripsi.

---

## 3. Rencana Pengujian & Verifikasi

1. **Verifikasi Kompilasi & Linting**:
   - Menjalankan `compile_applet` dan `lint_applet` bersamaan untuk menjamin 0 error TypeScript.
2. **Uji Fungsionalitas**:
   - Uji centang salat di Dashboard -> verifikasi otomatis centang di tab Ibadah.
   - Uji klik tanggal mendatang di kalender bulanan -> verifikasi pesan proteksi masa depan muncul.
   - Uji panel admin -> verifikasi daftar profil mahasiswa dan PIN dapat diakses oleh admin.
   - Uji tombol heningkan azan dan pencatatan notifikasi di Service Worker.
3. **Penyelarasan Versi**:
   - Memperbarui `CURRENT_VERSION` menjadi `2.11.0` di `storage.ts` dan menambahkan catatan rilis `v2.11.0` ke `APP_PATCH_NOTES`.
