# Rencana Pembaruan WaktuIbadah v2.8.0 (Widget Interaktif, Notifikasi Check-in +30 Menit, Azan Otomatis, Memphis Modern Tipis, & QoL Murottal)

Pembaruan besar untuk menghadirkan widget minimalis salat & tugas yang bisa disematkan/mengambang, notifikasi cerdas 30 menit setelah waktu salat dengan tombol aksi "Sudah Salat" otomatis, perbaikan pemutaran suara azan dari push/in-app, penyelarasan gaya visual Memphis modern tipis 1.5px pada menu Qur'an dan Doa Zikir, perapian tipografi halaman Menu, ikon SVG kustom pada bottom navigation bar, serta fitur QoL pemutar Murottal auto-scroll dengan penyorot ayat aktif dan pilihan suara Qari.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Berdasarkan konfirmasi pada sesi tanya jawab dan arahan spesifik Anda, keputusan implementasi telah dikunci sebagai berikut:
> 1. **Format Widget Salat & Tugas**: Menggabungkan **mode jendela widget minimalis terpisah (`/widget`)** yang ringkas dan resizable untuk layar utama/desktop/PWA homescreen, serta **Floating Mini-Widget** yang dapat dibuka/tutup dan diminimize saat berada di dalam aplikasi.
> 2. **Alur Notifikasi 30 Menit Pasca-Salat**: Mengirim notifikasi tepat 30 menit setelah waktu salat tiba dengan tombol aksi interaktif `[ Sudah Salat ✅ ]` langsung di push notification dan modal pengingat in-app. Sekali tekan, salat langsung terceklist di `wi_prayers` dan penyimpanan cloud secara otomatis.
> 3. **Ketebalan Gaya Memphis**: Menerapkan gaya **Memphis Modern Tipis** bergaris tepi presisi 1.5px (`border-[1.5px] border-[#121212]`) dengan bayangan offset halus (`shadow-[2px_2px_0px_#121212]`) dan palet warna lembut, seragam di menu Qur'an, Doa Zikir, dan kartu-kartu aplikasi.
> 4. **Pembaruan Versi**: Kenaikan versi dari **v2.7.0 ke v2.8.0** (posisi angka kedua bertambah karena penambahan fitur widget, cron azan, dan fitur QoL baru), lengkap dengan patch notes di Admin Dashboard.

---

## 1. Overview & Core Concept

- **Apa yang Dibangun**:
  1. **Widget Minimalis Salat & Tugas**: Mode widget terpisah (`/widget`) dan widget mengambang (*floating overlay*) yang memungkinkan pengguna langsung menceklis 5 waktu salat fardhu dan menyelesaikan tugas harian tanpa perlu menavigasi menu yang panjang.
  2. **Notifikasi 30 Menit Pasca-Salat**: Sistem pengingat otomatis di server cron (`api/_lib/events.js`) dan timer lokal yang menanyakan apakah pengguna sudah menunaikan salat, dengan tombol aksi sekali ketuk untuk menandai otomatis.
  3. **Pemutar Azan Push & In-App**: Penanganan klik notifikasi azan dan tindakan "Dengar Azan" yang memutar audio azan fardhu / subuh secara andal, serta pembukaan modal azan ketika waktu salat tiba.
  4. **Penyelarasan Style Memphis Modern Tipis**: Memadukan keanggunan clean look Al-Qur'an dan Doa Zikir dengan border tipis 1.5px dan aksen khas WaktuIbadah.
  5. **Ikon SVG Kustom Navigation Bar & Perapian Menu**: Ikon vektor SVG murni pada bilah navigasi bawah (Home, Jadwal, Ibadah, Doa, Qur'an, Menu) dan tipografi `font-semibold` yang seimbang pada menu utama.
  6. **Fitur QoL Unggulan**: Pemutar Murottal *Auto-Scroll* yang otomatis menyorot dan menggulir ke ayat yang sedang dilantunkan, pilihan multi-qari (Syaikh Misyari Rasyid, Syaikh As-Sudais, Syaikh Al-Ghamidi), dan tema membaca kertas kuno (*Sepia / Parchment*).

---

## 2. User Experience & Visual Design

### A. Widget Salat & Tugas Minimalis (`/widget` & In-App Floating)
1. **Mode Jendela Minimalis (`/widget`)**:
   - Halaman khusus ultra-ringkas berlatar belakang semi-transparan yang cocok untuk jendela mengambang, PiP, atau disematkan di homescreen wallpaper.
   - Header ringkas: Jam waktu nyata, indikator waktu salat aktif & countdown menuju salat berikutnya.
   - **Ceklis 5 Waktu Salat**: Tombol ceklis cepat Subuh, Dzuhur, Ashar, Maghrib, Isya dengan efek centang instan dan sinkronisasi real-time.
   - **Ceklis Tugas**: Daftar tugas hari ini dengan kotak centang sekali klik untuk menyelesaikan agenda kuliah/tugas.
   - Pengatur ukuran tampilan: Preset ukuran Mini, Sedang, dan Penuh (*resizable*).
2. **Floating Mini-Widget di Dalam Aplikasi**:
   - Tombol mengambang elegan di sudut layar yang dapat diminimize menjadi kapsul ringkas atau dibuka menjadi widget cepat tanpa meninggalkan halaman yang sedang dibaca.

### B. Pengingat Salat 30 Menit & Integrasi Suara Azan
1. **Notifikasi 30 Menit**:
   - Tepat 30 menit setelah azan berkumandang, jika salat tersebut belum diceklis, sistem push server dan timer aplikasi mengirimkan notifikasi:
     - Judul: *"Sudah Salat [Nama Salat]?"*
     - Isi: *"Waktu salat [Nama Salat] telah berjalan 30 menit. Ketuk 'Sudah Salat' untuk menandai otomatis."*
     - Aksi: `[ Sudah Salat ✅ ]` dan `[ Buka Aplikasi ]`.
   - Mengklik "Sudah Salat" langsung mencatat salat tersebut ke riwayat ibadah tanpa perlu membuka halaman penuh.
2. **Pemutaran Suara Azan**:
   - Pada notifikasi push azan, ditambahkan aksi `[ Dengar Azan 🔊 ]`.
   - Mengetuk notifikasi azan membuka aplikasi dengan parameter `?playAzan=1&prayer=[NamaSalat]` yang langsung memicu pemutaran audio azan lokal (`/audio/azan-fardhu.mp3` atau `/audio/azan-subuh.mp3`).

### C. Memphis Modern Tipis pada Menu Qur'an & Doa Zikir
- **Qur'an**: Menyelaraskan border menjadi 1.5px hitam solid tipis (`border-[1.5px] border-[#121212]`), bayangan offset 2px (`shadow-[2px_2px_0px_#121212]`), dengan tetap mempertahankan ornamen bintang segi-8 Islami SVG dan zebra striping yang rapi.
- **Doa & Zikir**: Merombak tampilan `DoaZikir.tsx` agar memiliki keselarasan visual dengan Qur'an: tab yang bersih, kolom pencarian, kartu wirid/doa ber-border 1.5px tipis, tasbih digital interaktif, dan tombol salin cepat.
- **Menu Utama (`Menu.tsx`)**: Mengurangi bobot huruf yang terlalu tebal (*bold shouting*), mengganti font menjadi `font-semibold` yang rapi dan teratur, mengelompokkan menu ke dalam kategori yang jelas, dan menyertakan ikon SVG tajam.

### D. Ikon SVG Kustom Navigation Bar Bawah
- Mengganti ikon pihak ketiga standar di bilah navigasi bawah (`Layout.tsx`) dengan ikon SVG vektor murni yang dirancang khusus:
  - **Home**: Ikon kubah lengkung modern / beranda
  - **Jadwal**: Ikon kalender / agenda bergaris presisi
  - **Ibadah**: Ikon kompas kiblat / jam salat melingkar
  - **Doa**: Ikon tadah tangan doa / ornamen berkah
  - **Qur'an**: Ikon mushaf terbuka dengan pita kaligrafi
  - **Menu**: Ikon 4-titik grid dashboard modern

### E. Fitur Quality of Life (QoL) Al-Qur'an
1. **Murottal Auto-Scroll & Highlighting**:
   - Saat audio ayat diputar kontinu, ayat yang sedang dibacakan qari akan disorot dengan latar hijau lembut dan digulirkan secara otomatis ke tengah layar pembaca.
2. **Pilihan Suara Qari**:
   - Menyediakan pilihan qari ternama di popover pengaturan pembaca:
     - Syaikh Misyari Rasyid Al-Afasy
     - Syaikh Abdurrahman As-Sudais
     - Syaikh Sa'ad Al-Ghamidi
3. **Tema Membaca Kertas Sepia / Parchment**:
   - Pilihan latar belakang membaca ketiga selain putih dan gelap: warna kertas mushaf klasik (`#F4EEDD` / `#2D241E`) yang sangat ramah mata di malam hari.

---

## 3. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    WAKTOUIBADAH v2.8.0                      │
├──────────────────────────────┬──────────────────────────────┤
│      WIDGET ENGINE           │ PUSH & NOTIFICATION CRON     │
│ • /widget route (resizable)  │ • +30 min post-prayer event  │
│ • Floating In-App overlay    │ • Direct 'sudah_salat' action│
│ • 5-Prayer & Task Checkers   │ • Azan audio playback trigger│
├──────────────────────────────┴──────────────────────────────┤
│                 UI & STYLING ARCHITECTURE                   │
│ • Thin Modern Memphis (1.5px border, 2px shadow)            │
│ • Unified Quran & DoaZikir visual system                    │
│ • Bespoke SVG bottom navigation bar                         │
│ • Refined Menu typography & grouping                        │
├─────────────────────────────────────────────────────────────┤
│                   QURAN QoL EXTENSIONS                      │
│ • Continuous Murottal Auto-Scroll & Ayah Highlighting       │
│ • Multi-Qari Audio Engine (Misyari, Sudais, Al-Ghamidi)     │
│ • Sepia Parchment Eye-Comfort Reading Mode                  │
└─────────────────────────────────────────────────────────────┘
```

### Pembaruan Versi Aplikasi (v2.8.0)
- Menambahkan rilis **v2.8.0** ke `APP_PATCH_NOTES` di `src/types.ts` dan memperbarui `CURRENT_VERSION` di `src/lib/storage.ts`:
  - **Highlights**: Mode Widget Salat & Tugas minimalis terpisah dan floating, notifikasi check-in 30 menit pasca-salat dengan aksi otomatis 'Sudah Salat', pemutaran azan push notification & in-app, penyesuaian style Memphis modern tipis 1.5px di Qur'an & Doa Zikir, perapian tipografi Menu dengan ikon SVG, perombakan ikon navigation bar bawah SVG kustom, serta fitur QoL Murottal auto-scroll, pemilih qari, dan tema kertas sepia.
  - **Saran Update Selanjutnya**:
    1. *Fitur Terdekat*: Mode Hafalan Qur'an (fitur sembunyikan ayat sebagian untuk melatih hafalan juz).
    2. *UI/UX*: Animasi transisi lembar halaman mushaf (page-flip effect).
    3. *QoL*: Ekspor checklist ibadah bulanan ke format gambar estetik untuk dibagikan ke media sosial.
    4. *Perbaikan*: Penghematan baterai background sync saat status perangkat berada dalam mode hemat daya.
