# Rencana Implementasi: Permission Gatekeeper Notifikasi, Kalibrasi Volume Audio, Tema Manual & Penanda Ayat Al-Qur'an

Rencana komprehensif untuk memfokuskan alur izin notifikasi browser/PWA sebelum pengguna masuk ke dashboard utama, mengecilkan efek suara tombol UI sambil mempertahankan volume keras Azan, menambahkan sakelar tema terang/gelap manual dengan tampilan Al-Qur'an selalu latar putih bersih, serta memisahkan penandaan "Terakhir Baca" dan "Ayat Favorit".

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Berdasarkan konfirmasi pilihan Anda:
> 1. **Mekanisme Izin Notifikasi**: Menampilkan **Notification Permission Modal** interaktif saat pengguna pertama kali membuka aplikasi atau belum memberikan izin notifikasi peramban/HP, sebelum mengarahkan ke dashboard utama.
> 2. **Kontrol Tema (Light/Dark Mode)**: Menyediakan **Sakelar Tema Manual** (Mode Terang vs Mode Gelap) di Pengaturan, dengan ketentuan khusus bahwa **tampilan pembacaan Al-Qur'an (`/quran`) selalu menggunakan latar putih bersih dan teks Arab hitam kontras tinggi** agar tidak terganggu oleh pembalikan warna otomatis HP.
> 3. **Pemisahan Penanda Ayat**: Fitur penanda Al-Qur'an dipisahkan secara tegas menjadi dua tindakan independen:
>    - **Tandai Terakhir Baca** (Bookmark Posisi — 1 ayat aktif yang diperbarui secara otomatis).
>    - **Simpan Ayat Favorit** (Favorit — koleksi banyak ayat pilihan untuk dibaca ulang).
> 4. **Level Volume Suara**: Suara tombol UI (button tap, toggle, tab switch, task complete) dikecilkan menjadi lebih lembut (~25-30% gain volume), sedangkan **Azan, Alarm, dan Uji Tes Suara Azan tetap berbunyi keras 100%**.

- **Keputusan Terkonfirmasi 1**: Aplikasi dapat langsung mengirimkan Web Notification & suara Azan di HP/laptop pengguna bahkan ketika dibuka biasa melalui browser web tanpa wajib di-install sebagai PWA.
- **Keputusan Terkonfirmasi 2**: Notifikasi Azan berbunyi disertai floating banner & control bar interaktif dengan tombol "Hentikan Azan" saat waktu salat tiba.

---

### 1. Overview & Core Concept

- **Apa yang Dibangun**:
  1. **Notification Permission Gatekeeper Modal**: Pop-up edukatif berdesain Memphis yang memandu pengguna memberikan izin notifikasi peramban (`Notification.requestPermission()`) sebelum mengakses dashboard.
  2. **Web Notifications System & Direct Audio Player**: Engine notifikasi peramban independen yang memicu alert dan suara Azan lokal (Subuh & Fardhu) dengan tombol penghenti ("Hentikan Azan").
  3. **Volume Gain Scaler (`audio.ts`)**: Kalibrasi gain node / volume audio lokal sehingga suara efek sentuhan tombol menjadi lembut (0.25-0.30 volume) dan tidak mengejutkan, tanpa mengurangi kenyaringan suara Azan (1.0 volume).
  4. **Tampilan Al-Qur'an Latar Putih Bersih & Tema Manual**: Mode membaca surah & ayat Al-Qur'an dikunci pada latar putih bersih (`#FFFDF8` / `#FFFFFF`) dengan huruf Arab hitam tajam (`#121212`), serta ditambahkan sakelar tema terang/gelap di halaman Pengaturan.
  5. **Dua Tombol Spesial Ayat**: Tombol **"Tandai Terakhir Baca"** (penanda posisi 1 ayat) dan **"Favoritkan Ayat"** (koleksi tersimpan) dipisahkan secara visual pada setiap baris ayat.

---

### 2. User Experience & Visual Design

#### A. Alur Permintaan Izin Notifikasi (Gatekeeper Flow)
1. **Awal Buka Aplikasi**:
   - Sistem memeriksa status `Notification.permission` di browser.
   - Jika status masih `default` (belum diminta/dipilih), aplikasi menampilkan **Notification Permission Modal** dengan animasi Memphis.
   - Modal menjelaskan manfaat notifikasi (jadwal azan tepat waktu, pengingat deadline tugas, suara azan Subuh & Fardhu).
   - Pengguna mengklik tombol **"Aktifkan Notifikasi Salat"**.
   - Peramban meminta izin native. Setelah diizinkan, modal ditutup dan pengguna masuk ke dashboard.
   - Jika peramban diblokir/ditolak, modal memberi panduan ringkas cara mengaktifkannya kembali via ikon gembok URL browser.

2. **Notifikasi Azan & Tombol Hentikan**:
   - Ketika waktu salat Tiba (online maupun di browser), Web Notification terkirim ke sistem notifikasi HP/laptop.
   - Suara Azan diputar di latar belakang.
   - Floating Control Banner muncul di layar atas dengan tombol menonjol **"Hentikan Azan"** (atau "Mute").

#### B. Pengalaman Membaca Al-Qur'an & Tema
- **Latar Putih Khusus Al-Qur'an**: Kartu ayat, teks Arab, transliterasi Latin, dan terjemahan di halaman `/quran` selalu dirender pada latar belakang putih bersih (`bg-[#FFFDF8]` / `bg-white`), sehingga terhindar dari bug pembalikan warna gelap yang membuat huruf Arab pudar.
- **Dua Action Button pada Setiap Ayat**:
  - 📌 **Tandai Terakhir Baca**: Mengeset indikator "Terakhir Dibaca pada Surat X Ayat Y", memudahkan melanjutkan tilawah dari dashboard.
  - ⭐ **Simpan ke Favorit**: Menambahkan ayat ke daftar koleksi "Ayat Favorit" yang dapat dibuka dari tab khusus.

---

### 3. Key Product Decisions & Trade-Offs

- **Keputusan 1: Pengoperasian Notifikasi Tanpa Install PWA**:
  - *Pendekatan*: Menggunakan kombinasi standar HTML5 `Notification` API, Web Audio API, dan `setInterval` / Web Worker pemicu waktu lokal.
  - *Alasan*: Pengguna yang hanya membuka aplikasi via tautan browser tetap mendapatkan pengingat azan dan notifikasi tanpa hambatan.
- **Keputusan 2: Pemisahan Volume Audio UI vs Azan**:
  - *Pendekatan*: Mengatur `audio.volume = 0.25` secara terprogram pada fungsi `playButtonTapSound`, `playToggleSound`, `playTabSwitchSound`, dan `playDhikrTapSound` di `src/lib/audio.ts`, sedangkan `playPrayerAzan` dan `testAlarmTone` tetap diset pada `audio.volume = 1.0`.
  - *Alasan*: Menghindari suara klik tombol yang terlalu bising/kaget saat HP dipasang volume tinggi, namun menjamin azan tetap terdengar nyaring.
- **Keputusan 3: Penguncian Latar Putih Pembacaan Al-Qur'an**:
  - *Pendekatan*: Menghapus kelas `dark:bg-*` dan `dark:text-*` pada komponen kontainer ayat Al-Qur'an dan menguncinya dengan kelas `bg-white text-[#121212]`.
  - *Alasan*: Memastikan huruf Arab khat Utsmani selalu terbaca tajam dan tidak pudar atau abu-abu akibat seleksi tema gelap otomatis browser/HP.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                      WAKTUIBADAH APP                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │           Notification Permission Gatekeeper        │   │
│   │  • Checks Notification.permission on load           │   │
│   │  • Shows Interactive Memphis Permission Modal        │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                Audio & Volume Engine                │   │
│   │  • UI Sounds (Tap/Toggle/Tab): Gain Volume = 0.25   │   │
│   │  • Azan & Alarm Sounds: Gain Volume = 1.0           │   │
│   │  • Persistent Floating "Hentikan Azan" Banner       │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │            Quran Reader & Bookmark Engine           │   │
│   │  • Forced Bright Clean White Background for Ayahs   │   │
│   │  • Separate "Tandai Terakhir Baca" (Single active)  │   │
│   │  • Separate "Simpan Ayat Favorit" (Collection list) │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Komponen Utama yang Dimodifikasi & Dibuat:
1. `src/lib/audio.ts`: Kalibrasi volume audio UI (~25-30%) vs Azan (100%).
2. `src/components/NotificationGatekeeperModal.tsx`: Permintaan izin notifikasi interaktif pada awal sesi jika belum diizinkan.
3. `src/pages/QuranHadis.tsx` & `src/components/SurahDetailModal.tsx`: Tampilan latar putih bersih untuk huruf Arab & pemisahan 2 tombol spesial (Tandai Terakhir Baca & Favorit).
4. `src/pages/Settings.tsx`: Penambahan sakelar Tema Manual (Terang / Gelap) & kalibrasi pengaturan izin notifikasi.
5. `src/lib/storage.ts`: Penyimpanan state `lastReadAyah` dan `favoriteAyahs` terpisah.
