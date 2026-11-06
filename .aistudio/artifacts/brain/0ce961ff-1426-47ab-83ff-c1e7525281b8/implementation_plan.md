# Rencana Implementasi Pembaruan WaktuIbadah v2.9.0

Pembaruan komprehensif ini menyempurnakan fungsi widget desktop/homescreen, kalender interaktif pada Jadwal dan Ibadah, validasi waktu salat masa depan, ajakan wirid pasca-salat, perbaikan tipografi responsif (anti-tumpang tindih), fitur Tajwid berwarna Kemenag, salat Jumat untuk laki-laki, dan pembersihan audio pack ganda.

---

## Tinjauan Pengguna & Keputusan Kritis

> [!IMPORTANT]
> Berdasarkan jawaban klarifikasi yang telah Anda konfirmasi:
> 1. **Tajwid Berwarna**: Diterapkan mode warna tajwid standar Kemenag RI (Ghunnah, Ikhfa, Idgham, Iqlab, Qalqalah, Mad) yang dapat diaktifkan/dinonaktifkan langsung melalui modal pengaturan pembaca Al-Qur'an.
> 2. **Wirid & Doa Pasca-Salat**: Menampilkan pop-up dialog ajakan wirid sesaat setelah pengguna mencentang salat fardhu apa pun, dilengkapi opsi sakelar *"Jangan ingatkan lagi"* dan pengaturan permanen di menu Pengaturan.
> 3. **Kalender Jadwal & Ibadah**: Menerapkan strip horizontal geser tanggal yang intuitif (hari sebelumnya/berikutnya) disertai tombol pemilih kalender cepat dan akses untuk mengisi catatan ibadah hari-hari lampau (*qadha/backfill*).

---

## 1. Ikhtisar & Konsep Utama

- **Widget Desktop / Laptop & Homescreen**: Rute `/widget` kini dilengkapi tombol **"Buka Jendela Desktop (Pop-Out)"** menggunakan ukuran jendela ringkas tanpa browser chrome (serta dukungan Document Picture-in-Picture jika didukung peramban), serta pintasan PWA langsung di `manifest.webmanifest`.
- **Kalender Interaktif pada Jadwal & Ibadah**:
  - Tombol navigasi hari (`<` dan `>`) untuk berpindah hari secara cepat.
  - Tanggal yang dipilih dapat melihat dan mengisi ibadah hari sebelumnya.
  - **Kunci Waktu Salat Masa Depan**: Salat pada hari esok atau waktu hari ini yang belum tiba (misal: baru Subuh, maka Zuhur, Asar, Magrib, Isya terkunci) tidak bisa diceklis sampai waktunya masuk.
- **Salat Jumat untuk Laki-laki**: Jika gender pengguna diatur sebagai *Laki-laki* dan hari yang dipilih adalah hari Jumat, nama ibadah zuhur otomatis disesuaikan menjadi **Salat Jumat** (atau *Jumat / Zuhur*).
- **Anti Tumpang-Tindih Teks (Zero-Truncation / Anti-Overlap)**: Penataan ulang layout pada layar ponsel sempit agar judul (seperti *"Kumpulan Doa & Zikir"*, *"Widget Layar & Wallpaper"*, dan nama surah panjang) mengecilkan font secara proporsional atau memindahkan tombol aksi ke baris tersendiri tanpa pernah terpotong atau tertimpa.
- **Tajwid Berwarna**: Integrasi teks ayat dengan penandaan warna tajwid Kemenag RI yang membedakan hukum bacaan secara visual, disertai switch toggle di pengaturan.
- **Perbaikan Audio & Pembersihan Sound Pack**: Menghilangkan pemicu ganda (*double tap*) saat membuka surah dan meredam efek suara keras agar pengalaman membaca tenang dan khusyuk.
- **Pemberitahuan Izin Notifikasi di Onboarding**: Memberikan dialog edukasi preferensi notifikasi di awal saat pengguna pertama kali mengatur profil.

---

## 2. Diagram Alur & Arsitektur Sistem

```
┌────────────────────────────────────────────────────────────────────────┐
│                        WAKTIUBADAH v2.9.0 CORE                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    ▼                               ▼                               ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│  WIDGET POP-OUT &    │  │  KALENDER JADWAL &   │  │  AL-QUR'AN TAJWID    │
│  PWA HOMESCREEN      │  │  LOG IBADAH HARIAN   │  │  BERWARNA (KEMENAG)  │
├──────────────────────┤  ├──────────────────────┤  ├──────────────────────┤
│ • Window Pop-Out     │  │ • Tombol Geser < / > │  │ • Parser Warna Tajwid│
│ • PiP Floating Mode  │  │ • Akses Hari Lampau  │  │ • Ghunnah/Ikhfa/Mad  │
│ • Ceklis Salat/Tugas │  │ • Lock Waktu Depan   │  │ • Sakelar On/Off     │
│ • Manifest Shortcut  │  │ • Label Salat Jumat  │  │ • Unbold Font Judul  │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
    │                               │                               │
    └───────────────────────────────┼───────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   PERBAIKAN QoL, UI & BUG AUDIO                       │
├────────────────────────────────────────────────────────────────────────┤
│ • Eliminasi Double Sound tap + open surah                              │
│ • Modal Wirid & Doa instan pasca-ceklis salat (dengan opsi silent)     │
│ • Responsif font mobile: flex-wrap, text-shrink, zero-overlap          │
│ • Onboarding: konfirmasi izin notifikasi di awal                       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Rincian Teknis Per Komponen

### A. Widget Desktop & Homescreen (`/src/pages/WidgetPage.tsx`, `/public/manifest.webmanifest`)
1. Menambahkan tombol **"Pop-out Desktop Widget"** dengan `window.open('/widget', 'WidgetWaktuIbadah', 'width=380,height=600,menubar=no,toolbar=no,location=no,status=no,resizable=yes')` untuk laptop dan PC.
2. Menambahkan dukungan API `documentPictureInPicture` bila peramban mendukung, memungkinkan widget selalu mengambang di atas semua aplikasi desktop (*always-on-top*).
3. Memperbarui `manifest.webmanifest` dengan pintasan resmi *shortcuts* khusus `/widget`.

### B. Kalender Geser & Kunci Waktu Salat (`/src/pages/Jadwal.tsx`, `/src/pages/Ibadah.tsx`)
1. **Navigasi Tanggal Geser**: Tombol panah kiri (`subDays(selectedDate, 1)`) dan panah kanan (`addDays(selectedDate, 1)`) serta tombol *Hari Ini* dan kalender pemilih cepat.
2. **Pengisian Hari Lampau**: Tanggal sebelum hari ini dapat dibuka untuk mencatat ibadah yang terlewat.
3. **Kunci Salat Masa Depan**:
   - Jika `selectedDate > today`: Semua ceklis salat fardhu dinonaktifkan (`disabled`) dengan keterangan *"Waktu belum tiba"*.
   - Jika `selectedDate === today`: Membandingkan waktu sekarang (`HH:mm`) dengan waktu salat masing-masing dari jadwal resmi. Salat yang belum masuk waktunya terkunci dari centangan.
4. **Dukungan Salat Jumat**: Jika pengguna berjenis kelamin laki-laki (`user.gender === 'male'` atau `"Laki-laki"`) dan hari tersebut adalah hari Jumat, teks "Zuhur" ditampilkan sebagai **"Salat Jumat"** (atau *"Salat Jumat / Zuhur"*).

### C. Alur Wirid & Doa Pasca-Salat
1. Ketika salat fardhu dicentang selesai, periksa pengaturan `reminderSettings.autoPromptWirid !== false`.
2. Jika aktif, munculkan modal dialog elegan yang menawarkan: *"Alhamdulillah telah menunaikan [Nama Salat]. Lanjutkan dengan wirid & doa sesudah salat?"*
3. Terdapat tombol *"Buka Wirid"* dan tombol centang *"Jangan ingatkan lagi"* yang tersimpan di `localStorage`.

### D. Tajwid Berwarna Al-Qur'an (`/src/lib/tajweed.ts`, `/src/pages/QuranHadis.tsx`, `/src/components/QuranReaderSettingsModal.tsx`)
1. Membuat modul parser tajwid Kemenag `parseTajweedVerse(arabicText: string)` yang mendeteksi pola tajwid:
   - **Ghunnah** (Nun & Mim Tasydid): Hijau Emerald (`text-emerald-600 dark:text-emerald-400 font-semibold`)
   - **Ikhfa / Ikhfa Syafawi**: Oranye Amber (`text-amber-600 dark:text-amber-400 font-semibold`)
   - **Idgham**: Biru Cyan (`text-cyan-600 dark:text-cyan-400 font-semibold`)
   - **Iqlab**: Ungu Violet (`text-purple-600 dark:text-purple-400 font-semibold`)
   - **Qalqalah**: Merah Rose (`text-rose-600 dark:text-rose-400 font-semibold`)
   - **Mad Wajib / Jaiz**: Merah Tua Crimson (`text-red-600 dark:text-red-500 font-semibold`)
2. Menambahkan opsi di `QuranReaderSettingsModal`: **"Warna Tajwid Kemenag"** (Aktif / Nonaktif).
3. Menyesuaikan ketebalan huruf judul surah di daftar Al-Qur'an dari `font-extrabold` menjadi `font-medium` / `font-semibold` yang lebih nyaman dipandang.

### E. Penanganan Bug Audio & Perapian Layout
1. **Double Sound Elimination**: Menghentikan tumpang-tindih antara `playButtonTapSound()` global di `Layout.tsx` dan `playQuranSound('open')` di `QuranHadis.tsx`. Meredam suara pembuka surah agar tenang.
2. **Pembersihan Audio Pack**: Memastikan sound effect tidak berisik dan volume seimbang (`~0.20`).
3. **Anti Tumpang-Tindih Judul di Mobile**:
   - Memastikan `truncate` dan `break-words` diterapkan dengan pembungkus fleksibel (`min-w-0 flex-1`).
   - Tombol aksi di sebelah kanan judul pada layar kecil disetel agar tidak menimpa teks.
   - Pengecilan ukuran font header tanggal di Ibadah (dari teks raksasa menjadi `text-xs sm:text-sm`).

### F. Onboarding Izin Notifikasi
- Di halaman Onboarding (`/src/pages/Onboarding.tsx`), tambahkan langkah pilihan preferensi notifikasi azan & pengingat salat secara eksplisit.

---

## 4. Rencana Rilis Versi v2.9.0

Sesuai aturan format versi:
- Versi dinaikkan ke **v2.9.0** (posisi angka ke-2 naik karena ada penambahan fitur penting).
- `APP_PATCH_NOTES` di `src/types.ts` dan `CURRENT_VERSION` di `src/lib/storage.ts` diperbarui.
- Catatan rilis v2.9.0 akan muncul saat mengklik tombol versi di Dashboard Admin dan menu Pengaturan, lengkap dengan rekomendasi fitur selanjutnya.
