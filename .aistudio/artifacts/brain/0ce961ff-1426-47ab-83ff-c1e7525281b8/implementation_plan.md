# Modul Al-Qur'an Mushaf Continuous Page View, Tafsir Kemenag Drawer, Reader Settings & Export/Import Data Backup (v2.4.0)

Pembaruan tingkat menengah (**v2.4.0**) yang menambahkan fitur **Mode Per Halaman Mushaf Al-Qur'an (Teks Arab Kontinu)**, **Drawer Tafsir Ringkas Kemenag RI per Ayat**, **Mode Fullscreen Reader**, **Export & Import Backup Data JSON** di Pengaturan, serta **Offline Murottal IndexedDB Caching**.

## User Review & Critical Decisions

> [!IMPORTANT]
> Keputusan dan preferensi pengguna yang telah dikonfirmasi melalui klarifikasi:

- **Confirmed Choice 1 (Visual & Navigasi Mushaf)**: Mode Baca Per Halaman menampilkan teks Arab mengalir secara sambung ala Mushaf standar dengan nomor ayat melingkar di akhir ayat dan sakelar toggle antar Mode Per Ayat (Kartu) vs Mode Per Halaman (Mushaf).
- **Confirmed Choice 2 (Mekanisme Akses Tafsir Kemenag RI)**: Mengetuk teks ayat Al-Qur'an (baik di mode per ayat maupun mode mushaf) langsung membuka *Bottom Sheet / Drawer Tafsir Ringkas Kemenag RI* per ayat.
- **Confirmed Choice 3 (Mode Fullscreen Reader & Sakelar Teks)**: Tombol Fullscreen dedicated di sticky header Al-Qur'an beserta drawer pengatur visibilitas teks Arab, Transliterasi Latin, dan Terjemahan Indonesia (termasuk opsi Hanya Arab, Arab+Latin, atau Lengkap).
- **Confirmed Choice 4 (Fitur Backup Data & Versioning v2.4.0)**: Opsi Export (.json) & Import data cadangan di Pengaturan, serta pembaruan versi aplikasi menjadi `v2.4.0` dengan Patch Notes resmi.

---

## 1. Overview & Core Concept

1. **Mode Baca Mushaf (Per Halaman Kontinu)**:
   - Pengguna dapat memilih mode baca Al-Qur'an: **Per Ayat (Card View)** atau **Per Halaman / Mushaf (Continuous Page View)**.
   - Pada mode Mushaf Kontinu, teks Arab mengalir tersambung alami seperti halaman kitab suci Al-Qur'an dengan ornament nomor ayat melingkar Arabic numerik.
2. **Sakelar Teks Kustom di Pengaturan Reader**:
   - Pengguna dapat mengatur kombinasi elemen yang tampil:
     - Teks Arab saja (Hanya Arab)
     - Teks Arab + Transliterasi Latin
     - Teks Arab + Terjemahan Indonesia
     - Teks Lengkap (Arab + Latin + Terjemahan)
3. **Bottom Sheet Tafsir Kemenag RI**:
   - Mengambil data tafsir ringkas per surat dari API `https://equran.id/api/v2/tafsir/{surahNumber}`.
   - Saat teks ayat diketuk, muncul drawer bawah interaktif yang menampilkan teks ayat, terjemahan, dan analisis tafsir Kemenag RI.
4. **Mode Fullscreen Reader**:
   - Tombol toggle Fullscreen di header Al-Qur'an menyembunyikan header modal & bottom navigation untuk kenyamanan membaca tanpa distraksi.
5. **Backup & Restore Data JSON**:
   - Menu di halaman Pengaturan untuk mengunduh semua data lokal (jadwal ibadah, jurnal tilawah, ayat/hadits favorit, catatan tadabbur, dan preferensi pengaturan) dalam format file JSON.
   - Tombol restore/import file JSON dengan validasi skema data.
6. **IndexedDB Audio Caching**:
   - Audio murottal per ayat yang pernah diputar disimpan secara otomatis ke IndexedDB storage browser sehingga dapat diputar kembali tanpa kuota/internet.

---

## 2. Technical Architecture & System Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ANTARMUKA PENGGUNA (VITE + REACT)                  │
├───────────────────────────────┬─────────────────────────────┬───────────────┤
│    QuranHadis (Modul Al-Qur'an)│     TafsirDrawer Component  │ Settings Page │
│  - Mode Per Ayat vs Mushaf    │  - Bottom Sheet Kemenag RI  │ - Backup JSON │
│  - Single-row Sticky Header   │  - Multi-source fallback    │ - Restore JSON│
│  - Fullscreen Toggle          │  - Catatan Tadabbur link    │ - Versi v2.4.0│
└───────────────┬───────────────┴──────────────┬──────────────┴───────┬───────┘
                │                              │                      │
                ▼                              ▼                      ▼
┌───────────────────────────────┬─────────────────────────────┬───────────────┐
│     Quran Storage & Cache     │   Equran.id API / Tafsir    │ LocalStorage  │
│  - IndexedDB Murottal Caching │   https://equran.id/api/v2/ │ -wi_user, etc │
│  - LocalStorage Reader Config │   tafsir/{surahNumber}      │ -wi_version   │
└───────────────────────────────┴─────────────────────────────┴───────────────┘
```

---

## 3. Implementation Steps

### Step 1: Update Constants & Versioning (`src/lib/storage.ts` & `src/types.ts`)
- Update `CURRENT_VERSION` menjadi `"2.4.0"`.
- Tambahkan entri patch note `v2.4.0` di `APP_PATCH_NOTES` (`src/types.ts`) yang merangkum Mode Mushaf Kontinu, Tafsir Kemenag RI Drawer, Fullscreen Reader, dan Backup/Restore JSON.

### Step 2: Implement Tafsir API Service (`src/lib/quran-api.ts`)
- Tambahkan fungsi `getSurahTafsir(surahNumber: number)` yang mengambil tafsir ringkas Kemenag dari `https://equran.id/api/v2/tafsir/${surahNumber}`.
- Sediakan fallback cache di `localStorage`/`IndexedDB` jika perangkat sedang offline.

### Step 3: Integrate IndexedDB Murottal Audio Cacher (`src/lib/murottal-cache.ts`)
- Buat utility IndexedDB sederhana untuk menyimpan blob audio murottal yang telah diunduh/diputar per ayat/surat.
- Saat audio diputar, cek apakah blob audio tersedia di IndexedDB; jika ada, gunakan `URL.createObjectURL(blob)`, jika tidak, fetch dan simpan ke cache.

### Step 4: Enhance Reader Settings & Add Continuous Mushaf View in `src/pages/QuranHadis.tsx`
- **State Tambahan**:
  - `readingMode`: `'card'` (per ayat) | `'mushaf'` (per halaman/kontinu)
  - `showArabic`: `boolean` (default: `true`)
  - `showLatin`: `boolean`
  - `showTranslation`: `boolean`
  - `isFullscreen`: `boolean`
  - `selectedTafsirAyah`: `{ surah: SurahItem; ayah: AyatItem; tafsirText: string } | null`
  - `isTafsirDrawerOpen`: `boolean`
- **Mode Mushaf Kontinu**:
  - Render blok container `bg-[#FAF9F5] dark:bg-slate-900 border-1.5 border-black p-4 sm:p-6 rounded-2xl` tempat seluruh ayat Arab mengalir tersambung secara paragraf alami (`text-right font-serif leading-[2.6]`).
  - Setiap ayat dilengkapi angka Arab melingkar yang dapat diketuk.
  - Opsi menampilkan terjemahan/Latin di bawah blok paragraf atau secara popover saat ayat diketuk.
- **Tafsir Drawer Component**:
  - Bottom sheet yang mulus (animated slide-up) saat ayat diketuk.
  - Menampilkan judul surat, ayat ke-X, teks Arab, terjemahan, dan paragraf Tafsir Ringkas Kemenag RI.

### Step 5: Implement Export & Import Data Backup in `src/pages/Settings.tsx`
- **Export Data**:
  - Mengambil seluruh item dari `localStorage` bertawalan `wi_` (termasuk tugas, jadwal, logs, profil, doa favorit, catatan tadabbur).
  - Membuat objek JSON terenkripsi/terformat dan memicu unduhan file `waktuibadah_backup_YYYY-MM-DD.json`.
- **Import Data**:
  - File picker untuk membaca file JSON cadangan.
  - Validasi struktur file sebelum menyimpan kembali ke `localStorage` dan mereload state aplikasi.

---

## 4. Verification Plan

1. **Uji Mode Mushaf Kontinu**:
   - Buka surat Al-Fatihah dan Al-Baqarah dalam mode Mushaf.
   - Uji tombol pengatur Teks Arab (ON/OFF), Transliterasi Latin (ON/OFF), dan Terjemahan (ON/OFF).
   - Pastikan teks Arab mengalir dengan rapi tanpa overflow pada viewport 360px, 390px, dan 412px.
2. **Uji Tafsir Kemenag RI**:
   - Ketuk salah satu ayat Al-Qur'an dan pastikan Bottom Sheet Tafsir terbuka dengan memuat teks tafsir Kemenag RI yang sesuai.
3. **Uji Fullscreen Reader**:
   - Aktifkan tombol Fullscreen di header Al-Qur'an dan verifikasi header serta bottom bar tersembunyi dengan bersih.
4. **Uji Backup & Restore JSON**:
   - Jalankan fungsi Export Data di Pengaturan, verifikasi file `.json` terunduh.
   - Uji Impor file JSON dan pastikan data kembali secara utuh.
5. **Uji Kompilasi & Linting**:
   - Jalankan `compile_applet` dan `lint_applet` untuk memastikan zero syntax/build errors.
