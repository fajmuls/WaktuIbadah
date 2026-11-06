# Desain Baru Al-Qur'an (Clean Look, Multi-Hanca, Ornamen Bintang Islami & Navigasi Juz)

Rencana pembaruan komprehensif untuk antarmuka Al-Qur'an agar menyerupai referensi desain yang bersih, rapi, dan mudah dicari, dilengkapi ornamen Islami SVG asli, navigasi Juz 1–30, sistem multi-hanca bernama dengan dukungan unbookmark, dan pengaturan ukuran teks bertahap (A-- hingga A++).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Berdasarkan jawaban klarifikasi dan instruksi Anda, keputusan desain utama telah dikunci sebagai berikut:
> 1. **Sistem Penanda Terakhir Baca (Hanca)**: Menggunakan model **Multi-Hanca Bernama** (misal: *Harian*, *Tahfidz*, *Tadabbur*, atau kustom) di mana pengguna dapat membuat set baru, berpindah antar target bacaan, mencatat tanggal, serta melakukan unbookmark/reset kapan saja.
> 2. **Navigasi Antar Surah di Reader**: Menggunakan **Tab Bar Geser Horizontal** di bagian atas layar pembaca (seperti screenshot referensi: Al-Fatihah, Al-Baqarah, Ali 'Imran, dst.) sehingga berpindah surah dapat dilakukan dengan sekali sentuh.
> 3. **Tingkatan Ukuran Huruf Arab**: Disediakan **5 level ukuran tanpa angka piksel teknis**: `A--` (sangat ringkas/kecil), `A-` (ringkas), `A` (normal), `A+` (besar), dan `A++` (sangat besar).
> 4. **Penomoran Versi**: Sesuai aturan versioning Anda, penambahan fitur signifikan dan perombakan arsitektur ini menaikkan versi dari **v2.6.0 ke v2.7.0**, dilengkapi patch notes di Admin Dashboard dan saran perbaikan berkala.

---

## 1. Overview & Core Concept

- **Apa yang Dibangun**: Pembaruan menyeluruh modul Al-Qur'an yang memadukan keanggunan kaligrafi Arab, ornamen geometri Islam segi-8 (*Rub el Hizb*) berbasis SVG presisi, pemisahan tab modern (**SURAH**, **JUZ**, **BOOKMARK**), tampilan per ayat bernuansa zebra lembut (*cream* dan *white*), serta antarmuka pembaca per halaman mushaf yang jernih (*clean look*).
- **Target Pengguna**: Pembaca Al-Qur'an harian, penghafal (*tahfidz*), dan pembaca terjemah/tafsir yang membutuhkan antarmuka bebas distraksi, tidak makan tempat, dan mudah digunakan dengan satu tangan pada layar ponsel.
- **Nilai Utama**: Membaca terasa tenang dan nyaman di mata; tombol aksi tidak lagi menghalangi teks suci; status unduhan audio offline jelas; dan pencarian surah/juz terasa instan.

---

## 2. User Experience & Visual Design

### A. Tiga Tab Utama (Surah, Juz, Bookmark)
1. **Header Bersih & Pencarian**:
   - Header atas bergaya hijau zamrud khas aplikasi (`#0d5c46` / `#0f766e`) dengan logo kaligrafi Al-Qur'an melingkar, tombol kembali, ikon urutkan/filter, ikon pencarian, dan menu aksi.
   - Tab navigasi bergaris bawah cokelat/emas hangat: **SURAH**, **JUZ**, dan **BOOKMARK**.
2. **Tab Surah**:
   - Ornamen bintang segi-8 (*Rub el Hizb*) SVG di sisi kiri dengan nomor surah di tengah.
   - Judul surah (nama latin, tempat turun, dan jumlah ayat) sejajar dengan teks kaligrafi nama surah dalam aksara Arab di sisi kanan.
   - Ikon unduh murottal atau ikon speaker yang aktif jika audio telah tersimpan offline.
3. **Tab Juz (1–30)**:
   - Daftar 30 Juz lengkap dengan ornamen bintang nomor Juz.
   - Keterangan awal bacaan: *"Mulai di: [Nama Surah] Ayat [Nomor]"* (misal Juz 1: Mulai di Al-Fatihah Ayat 1; Juz 2: Mulai di Al-Baqarah Ayat 142).
   - Mengetuk item Juz langsung membuka surat dan melompat (*scroll*) tepat ke ayat awal juz tersebut.
4. **Tab Bookmark & Multi-Hanca**:
   - Menampilkan daftar set hanca aktif (misal "Tilawah Harian", "Hafalan Juz 'Amma") dengan tanggal terakhir dibaca dan tombol cepat lanjut membaca.
   - Tombol buat set hanca baru dan opsi hapus/unbookmark.

### B. Antarmuka Pembaca (Per Ayat & Per Halaman)
1. **Sub-Header & Tab Surah Geser**:
   - Di bawah app bar utama, terdapat pita tab geser horizontal (*horizontal scrollable surah chips*) yang menampilkan surah-surah berurutan (misal: `1. Al-Fatihah`, `2. Al-Baqarah`, `3. Ali 'Imran`, ...) memudahkan melompat ke surah berikutnya tanpa harus kembali ke daftar.
   - Di bawahnya terdapat kotak hiasan kepala surat (*Surah Header Frame*) dengan kaligrafi surat, jenis wahyu (Makkah/Madinah), dan jumlah ayat.
2. **Tampilan Zebra-Striping Per Ayat**:
   - Latar belakang bergantian yang lembut: Ayat ganjil berlatar putih bersih (`bg-white dark:bg-slate-900`), ayat genap berlatar krem gading lembut (`bg-[#FAF7EE] dark:bg-slate-800/60`).
   - Sisi kiri: Ornamen bintang segi-8 dengan nomor ayat western.
   - Teks Arab: Kaligrafi jelas dengan tanda waqaf dan nomor ayat Arab dalam lingkaran di akhir ayat `(١)`.
   - Terjemahan: Warna teks toska gelap/emerald yang sejuk dibaca.
3. **Tombol Aksi Ayat Kompak (4-Baris Samping / Footer Ringkas)**:
   - Tombol aksi tidak lagi berukuran raksasa atau menumpuk di atas teks.
   - Dibuat menjadi baris aksi 4 tombol yang terpadu dan minimalis:
     1. **Putar Audio** (Play/Pause ayat)
     2. **Tafsir Kemenag** (Membuka lembar penjelasan tafsir ringkas)
     3. **Favorit** (Simpan/Hapus dari favorit)
     4. **Hanca / Bookmark** (Tandai sebagai posisi terakhir baca atau unbookmark)
4. **Menu Pengaturan Pembaca Cepat (Ikon Gerigi di Kanan Atas)**:
   - Popover ringkas untuk mengatur:
     - Tampilkan Teks Latin: On / Off
     - Tampilkan Terjemahan: On / Off
     - Ukuran Teks Arab: 5 preset tombol (`A--`, `A-`, `A`, `A+`, `A++`) dengan batas ukuran terkecil yang nyaman hingga ukuran besar.

### C. Pembenahan Sistem Tema Aplikasi
- Memperbaiki binding tema di `Settings.tsx` dan `Layout.tsx` agar perpindahan tema (Emerald Green, Gold Beige, Midnight Dark, Minimal White) langsung diterapkan ke seluruh halaman termasuk reader Al-Qur'an.

---

## 3. Key Product Decisions & Trade-Offs

- **Multi-Hanca vs Single Last-Read**:
  - *Pendekatan*: Menyimpan array `ReadingHancaSet[]` di penyimpanan lokal/cloud dengan ID, nama set (misal "Khatam Ramadan", "Hafalan Subuh"), nomor surah, nama surah, nomor ayat, dan tanggal.
  - *Alasan*: Pengguna sering membaca Al-Qur'an dengan beberapa keperluan sekaligus (membaca harian satu juz, tahfidz beberapa surat pendek, dan tadabbur).
- **Ornamen Bintang Segi-8 Islami (*Rub el Hizb*)**:
  - *Pendekatan*: Menggunakan SVG murni dengan dua persegi bersilang dengan sudut rotasi 45 derajat atau poligon 8 sisi bertakik yang tajam dan presisi, bukan ikon lingkaran biasa.
  - *Alasan*: Menghadirkan nuansa mushaf Al-Qur'an standar Madinah/Kemenag yang otentik dan anggun tanpa menambah beban aset eksternal.
- **Preset Huruf 5 Level (A-- sampai A++)**:
  - *Pendekatan*: Menggunakan array ukuran font diskrit (`[18px, 22px, 26px, 30px, 36px]`) alih-alih slider piksel acak.
  - *Alasan*: Menghilangkan rasa teknis yang berantakan, serta memastikan rendering harakat kaligrafi Arab tidak rusak pada ukuran ekstrim.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    QURAN / HADIS MODULE                     │
├──────────────────────────────┬──────────────────────────────┤
│          HEADER BAR          │ 3-ZONE TOP NAVIGATION        │
│                              │ Search, Filter, Reader Tools │
├──────────────────────────────┴──────────────────────────────┤
│               3 TABS: SURAH | JUZ | BOOKMARK                │
├───────────────────┬───────────────────┬─────────────────────┤
│    Tab 1: SURAH   │    Tab 2: JUZ     │   Tab 3: BOOKMARK   │
│ • Star Badge SVG  │ • 30 Juz Index    │ • Multi-Hanca List  │
│ • Surah Calligr.  │ • Start Ayah Info │ • Create/Rename Set │
│ • Download Audio  │ • Direct Jump Nav │ • Unbookmark / Clear│
├───────────────────┴───────────────────┴─────────────────────┤
│                       READER VIEW                           │
├─────────────────────────────────────────────────────────────┤
│ • Horizontal Surah Tab Scroller (1. Al-Fatihah, 2. ...)     │
│ • Decorative Surah Frame (Surah title + revelation info)   │
│ • Zebra Rows (Cream / White alternating backgrounds)        │
│ • Ayah Star Badge & End-of-Ayah Circle Marker               │
│ • 4-Action Cluster: [Play] [Tafsir] [Favorit] [Bookmark]    │
│ • Quick Settings Modal: [Latin] [Terjemah] [A-- ... A++]    │
└─────────────────────────────────────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
       Local & Cloud Storage           Audio / Offline Cache
     (Hanca, Font, Favs, Theme)         (Murottal IndexedDB)
```

### Pembaruan Versi Aplikasi & Patch Notes (v2.7.0)
- Menambahkan rilis **v2.7.0** ke `APP_PATCH_NOTES` di `src/types.ts`:
  - **Highlights**: UI Al-Qur'an baru bergaya bersih dengan ornamen Islami SVG, tab Juz 1–30, multi-hanca bernama dengan unbookmark, zebra-striping per ayat, tab surah geser horizontal, tombol aksi ayat 4-baris kompak, serta popover pengaturan ukuran huruf 5 level.
  - **Saran Update Selanjutnya**:
    1. *Fitur Terdekat*: Pemutar audio per surah kontinu (*auto-scroll* mengikuti ayat yang sedang dilantunkan qari).
    2. *UI/UX*: Pilihan tema warna kertas kuno (*parchment / sepia*) untuk pembacaan malam hari.
    3. *QoL*: Pencarian cerdas ayat berdasarkan arti terjemahan bahasa Indonesia, bukan hanya nomor atau nama surah.
    4. *Perbaikan*: Sinkronisasi status audio unduhan offline secara instan saat koneksi internet terputus.
