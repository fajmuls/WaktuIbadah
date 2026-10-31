# Rencana Implementasi: Fitur Doa & Zikir, Modal Paska Salat 5 Waktu, UI Memphis Polkadot, & Audio Policy

Rencana komprehensif untuk mengintegrasikan modul Doa & Zikir lengkap, modal selebrasi paska salat fardhu 5 waktu, penempatan icon resmi aplikasi, background polkadot bergaya Memphis retro, penyesuaian nada hijau emerald yang teduh, banner fallback autoplay audio mobile, serta penyelarasan zona waktu dan kota di seluruh Indonesia.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Berdasarkan jawaban klarifikasi yang telah Anda tentukan:
> 1. **Menu Navigasi**: Menu khusus **"Doa & Zikir"** akan ditambahkan langsung pada sidebar navigasi desktop (`Layout.tsx`), menu mobile, dan pintasan beranda.
> 2. **Cakupan Doa**: Menyajikan panduan lengkap wirid dzikir & doa setelah salat fardhu sebagai tab utama, disertai doa-doa harian penting (makan, tidur, keluar rumah, bepergian, menuntut ilmu).
> 3. **Penyelarasan Zona Waktu**: Menyediakan deteksi lokasi GPS otomatis dilengkapi dropdown pilihan kota-kota besar di Indonesia (WIB, WITA, WIT) yang tersimpan permanen di pengaturan.

- **Keputusan Terkonfirmasi 1**: Modal "Doa Setelah Salat" otomatis muncul saat ke-5 salat fardhu dalam 1 hari dicentang selesai, dilengkapi sakelar "Jangan tampilkan otomatis lagi" agar fleksibel bagi pengguna.
- **Keputusan Terkonfirmasi 2**: Icon aplikasi resmi (`Icon WaktuIbadah.png`) diterapkan menyeluruh pada favicon `index.html`, header desktop/mobile, PWA shortcut, serta animasi pembuka splash screen.
- **Keputusan Terkonfirmasi 3**: Warna hijau distabilkan dari hijau neon menjadi hijau emerald alami (`#059669`, `#047857`, `#10B981`), serasi dengan dashboard utama dan tidak menyilaukan mata.

---

### 1. Overview & Core Concept

- **Apa yang Dibangun**:
  1. **Halaman Doa & Zikir (`/doa`)**: Halaman terdedikasi dengan panduan teks Arab, transliterasi Latin, terjemahan Indonesia, dan counter tasbih/zikir interaktif.
  2. **Modal Doa Setelah Salat Otomatis**: Pop-up selebrasi bernuansa Memphis yang muncul ketika pengguna menyelesaikan 5 waktu salat (Subuh, Zuhur, Asar, Magrib, Isya).
  3. **Visual Memphis Polkadot & Icon SVG**: Latar belakang aplikasi dipercantik dengan pola titik polkadot geometris Memphis, dan tombol-tombol antarmuka menggunakan ikon SVG Memphis dengan palet aksen harmonis.
  4. **Fallback Autoplay Audio Mobile**: Banner visual mengambang beranimasi untuk mengatasi kebijakan blokir suara otomatis di browser HP (Chrome/Safari), memungkinkan pengguna mengaktifkan audio azan sekali ketuk.
  5. **Pengaturan Zona Waktu Salat**: Fitur pemilihan wilayah salat (kota-kota di seluruh Indonesia) dengan sinkronisasi zona WIB, WITA, dan WIT yang akurat.
- **Target Pengguna**: Mahasiswa dan pengguna Muslim yang membutuhkan pendamping ibadah praktis, jadwal terpadu, dan panduan wirid yang mudah diakses di smartphone maupun laptop.
- **Versi Aplikasi**: Dinaikkan menjadi **v2.2.0** (tercatat eksklusif di halaman Pengaturan & Patch Notes).

---

### 2. User Experience & Visual Design

#### A. Alur Pengguna (User Flows)
1. **Penyelesaian Salat 5 Waktu**:
   - Pengguna mencentang salat ke-5 pada hari ini di halaman Ibadah atau widget Dashboard.
   - Suara efek capaian (*achievement sound*) berbunyi lembut, diikuti animasi konfeti Memphis.
   - Modal **"Alhamdulillah! 5 Salat Sempurna Hari Ini"** terbuka menampilkan ringkasan wirid dan doa setelah salat fardhu.
   - Pengguna dapat membaca doa langsung, menyalin teks, atau menonaktifkan kemunculan otomatis melalui opsi sakelar.
2. **Eksplorasi Doa & Zikir**:
   - Pengguna mengklik menu **"Doa & Zikir"** di navigasi sidebar atau mobile bar.
   - Tersedia tab filter segmented: **Wirid Setelah Salat**, **Doa Harian**, dan **Doa Menuntut Ilmu**.
   - Setiap doa dilengkapi kartu Memphis bertekstur, teks Arab dengan ukuran font yang nyaman dibaca, serta tombol salin dan audio pelafalan.
3. **Banner Fallback Audio di HP**:
   - Jika browser mobile menahan pemutaran otomatis audio azan, banner alert Memphis muncul di bagian atas layar: *"Waktu Salat [Nama] Tiba! Ketuk untuk Putar Azan"*.
   - Sekali diketuk, audio azan langsung berbunyi dan izin peramban otomatis terbuka untuk waktu berikutnya.

#### B. Identitas Visual & Tema
- **Pola Background**: `memphis-pattern-dots` halus dengan jarak 20px berlatar `#FFFDF8` (krem lembut) berpadu dot abu-abu muda (`#E5E7EB`), memberikan tekstur retro khas Memphis tanpa mengganggu keterbacaan teks.
- **Palet Warna Hijau**:
  - Hijau Utama: Emerald Green `#059669` (stabil, kontras tinggi, elegan).
  - Hijau Aksen/Border: Deep Forest `#065F46` dan Mint `#34D399`.
  - Aksen Memphis Tambahan: Coral Pink `#FF4B91`, Sky Blue `#00F0FF`, dan Sun Gold `#F59E0B`.
- **Button Icon SVG Memphis**:
  - Ikon tombol dirancang dengan geometri solid, border tebal hitam 2px, dan latar belakang bentuk bervariasi (lingkaran, kotak miring, pil mini).

---

### 3. Key Product Decisions & Trade-Offs

- **Keputusan 1: Struktur Data Doa Lokal vs Cloud**:
  - *Pendekatan*: Kumpulan doa dan wirid disimpan secara statis terstruktur di dalam modul aplikasi (`src/data/prayers-data.ts`) dengan status penanda bacaan/favorit disinkronkan ke Firestore.
  - *Alasan*: Menjamin seluruh wirid dan doa dapat diakses instan 100% offline tanpa menunggu koneksi internet, sangat krusial saat waktu salat di masjid atau area minim sinyal.
- **Keputusan 2: Penanganan Mobile Audio Policy**:
  - *Pendekatan*: Menggunakan deteksi Promise rejection saat memanggil `audio.play()`, lalu menampilkan Memphis Fallback Action Banner di DOM jika peramban menolak pemutaran otomatis.
  - *Alasan*: Standar keamanan modern iOS/Android mewajibkan interaksi pengguna (user gesture). Banner interaktif ini memberi solusi yang patuh kebijakan web sekaligus menjamin pengguna tidak ketinggalan azan.
- **Keputusan 3: Penyelarasan Kota & Zona Waktu**:
  - *Pendekatan*: Menghadirkan daftar kota rujukan di Indonesia (Jakarta, Bandung, Yogyakarta, Surabaya, Medan, Padang, Palembang, Banjarmasin, Balikpapan, Makassar, Manado, Denpasar, Mataram, Jayapura, Ambon) dengan koordinat lintang/bujur dan zona waktu (WIB=7, WITA=8, WIT=9).
  - *Alasan*: Menghindari ketergantungan mutlak pada API luar yang berisiko lambat atau error kuota, sambil tetap memberikan akurasi menit salat di seluruh nusantara.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                       WAKTIUBADAH APP                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌────────────────┐      ┌─────────────────────────────┐   │
│   │  Navbar / Nav  │ ───► │  Menu: Doa & Zikir (/doa)   │   │
│   └────────────────┘      └──────────────┬──────────────┘   │
│                                          │                  │
│   ┌────────────────┐                     ▼                  │
│   │ Ibadah Page &  │ ───► ┌─────────────────────────────┐   │
│   │ Dashboard Card │      │ DoaSetelahSalatModal (Auto) │   │
│   └────────────────┘      └─────────────────────────────┘   │
│           │                                                 │
│           ▼ (5 Salat Selesai)                               │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              Audio & Notification Engine            │   │
│   │  • Fallback Audio Banner (Mobile Autoplay Policy)   │   │
│   │  • Subuh & Fardhu Azan Players                      │   │
│   └─────────────────────────────────────────────────────┘   │
│           │                                                 │
│           ▼ (Lokasi & Zona)                                 │
│   ┌─────────────────────────────────────────────────────┐   │
│   │          Location & Prayer Schedule Engine          │   │
│   │  • Kota-kota Indonesia (WIB, WITA, WIT)             │   │
│   │  • GPS Auto-detect fallback                         │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Komponen Utama yang Dibuat & Dimodifikasi:
1. `src/data/prayers-data.ts`: Koleksi terverifikasi zikir wirid setelah salat (istighfar, tasbih, tahmid, takbir, ayat kursi, doa keselamatan) & doa harian umum.
2. `src/components/DoaSetelahSalatModal.tsx`: Modal selebrasi Memphis yang dipicu saat ke-5 salat selesai dicentang.
3. `src/pages/DoaZikir.tsx`: Halaman katalog doa & zikir lengkap dengan navigasi tab dan pencarian instan.
4. `src/components/AudioUnlockBanner.tsx`: Banner fallback deteksi autoplay policy untuk peramban ponsel.
5. `src/lib/prayer-times.ts` & `src/data/indonesian-cities.ts`: Modul konfigurasi kota Indonesia dan kalkulasi akurat WIB/WITA/WIT.
6. `src/components/Layout.tsx` & `src/App.tsx`: Penambahan link menu Doa, pembaruan logo brand dengan icon resmi, dan background polkadot Memphis.
7. `src/index.css`: Penambahan pola dot matrix Memphis dan kelas tombol ikon SVG Memphis.
8. `src/lib/storage.ts`: Bump versi ke `2.2.0` dan penambahan opsi preferensi modal doa otomatis.
