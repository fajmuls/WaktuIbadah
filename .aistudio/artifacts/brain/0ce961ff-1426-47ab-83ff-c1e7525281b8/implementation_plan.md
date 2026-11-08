# Notifikasi Azan Interaktif Background, Getar Haptic, Pengingat 10/30 Menit Pra-Azan & Widget Wallpaper (v2.10.0)

Penyempurnaan sistem notifikasi background PWA agar azan otomatis berbunyi dengan getaran haptic tanpa harus membuka aplikasi, aksi interaktif "Sudah Salat" dan "Heningkan Azan" langsung di banner notifikasi tanpa me-reload/membuka jendela web, pengaturan jeda pengingat sebelum azan (10 atau 30 menit) di awal aplikasi untuk pengguna baru dan lama, serta penyempurnaan mode widget mengambang di atas wallpaper desktop/HP.

## User Review & Critical Decisions

> [!IMPORTANT]
> Keputusan berdasarkan jawaban klarifikasi pengguna:
> - **Jeda Pengingat Pra-Azan**: Disediakan opsi preset 10 menit dan 30 menit sebelum waktu azan tiba (dapat dipilih di awal membuka aplikasi).
> - **Aksi Banner Notifikasi Azan**: Notifikasi azan langsung berbunyi otomatis dan banner menyediakan tombol interaktif **"Heningkan Azan"** dan **"Tutup"** tanpa membuka aplikasi.
> - **Aksi Notifikasi Check-in +30 Menit**: Mengetuk tombol **"Sudah Salat"** pada banner notifikasi langsung mencatat salat ke data lokal & cloud secara background tanpa membuka aplikasi.
> - **Widget Wallpaper**: Jendela Pop-out mengambang di atas wallpaper desktop/laptop dan mode PWA shortcut beranda HP dengan latar semi-transparan (glassmorphism) yang hemat ruang.

---

## 1. Overview & Core Concept

- **Apa yang Dibangun**:
  1. **Background Service Worker Actions**: Menangani aksi notifikasi `sudah_salat` dan `silence_azan` di dalam `public/sw.js` secara hening (*background silent execution*) tanpa memanggil `clients.openWindow()` atau memfokuskan tab browser.
  2. **Auto-Play Azan & Getar Haptic**: Notifikasi azan langsung memicu suara azan dan pola getar haptic `[200, 100, 200, 100, 300, 100, 500]` secara andal. Tombol "Dengar Azan" dihilangkan karena suara sudah otomatis bersuara; digantikan dengan tombol "Heningkan Azan".
  3. **Modal Setup Awal Pra-Azan (Pengguna Baru & Pengguna Lama)**: Dialog setup awal yang menanyakan preferensi waktu pengingat pra-azan (10 menit atau 30 menit sebelum azan) serta aktivasi suara azan otomatis. Muncul otomatis bagi pengguna baru saat onboarding dan pengguna lama yang belum menyetel preferensi ini.
  4. **Widget Wallpaper Pop-Out & PWA**: Penyempurnaan halaman `/widget` dengan mode jendela pop-out yang dapat diposisikan di sudut layar desktop (selaras dengan wallpaper), mendukung Document Picture-in-Picture jika tersedia di browser.
  5. **Versi Aplikasi Naik ke v2.10.0**: Sesuai instruksi pengguna, posisi angka kedua dinaikkan karena terdapat penambahan fitur background actions, auto-azan, modal setup pra-azan, dan patch notes diperbarui.

---

## 2. User Experience & Visual Design

### Alur Interaksi Pengguna (User Flows)
1. **Setup Awal Pengingat Pra-Azan**:
   - Pengguna baru atau pengguna lama yang baru memperbarui aplikasi disambut oleh modal elegan: *"Atur Pengingat Azan & Persiapan Salat"*.
   - Opsi: **10 Menit Sebelum Azan** (disarankan untuk bersiap wudhu), **30 Menit Sebelum Azan** (untuk menyelesaikan aktivitas/kuliah), atau **Tepat Waktu Saja**.
   - Sakelar Suara Azan Otomatis: Aktif secara default sehingga pengguna tidak perlu menekan tombol manual lagi.

2. **Saat Waktu Azan Masuk**:
   - Sistem membunyikan audio azan dengan getaran haptic berirama.
   - Banner notifikasi menampilkan judul *"Waktu Salat [Nama Salat] Masuk"* dengan 2 tombol aksi:
     - **[Heningkan Azan]**: Menghentikan lantunan azan seketika tanpa membuka aplikasi.
     - **[Tutup]**: Menutup notifikasi.

3. **Notifikasi Check-in 30 Menit Pasca-Salat**:
   - Banner notifikasi bertanya: *"Apakah Anda sudah menunaikan salat [Nama Salat]?"*
   - Tombol **[Sudah Salat]**: Seketika mencatat status salat ke database/storage lokal dan mengirim konfirmasi toast/silent notification tanpa membuka tab atau jendela aplikasi baru.

4. **Widget Wallpaper Desktop / Mobile**:
   - Pengguna menekan tombol *"Pasang ke Wallpaper"* di halaman widget.
   - Jendela pop-out compact minimalis terbuka mandiri tanpa address bar / tab browser, dengan opsi latar glassmorphism yang serasi dengan wallpaper pengguna.

---

## 3. Key Product Decisions & Trade-Offs

- **Penyimpanan Status Salat dari Background Service Worker**:
  - *Keputusan*: Service worker (`public/sw.js`) menggunakan `IndexedDB` dan `postMessage` broadcast ke semua klien aktif, serta endpoint API `/api/confirm-prayer` (jika dev server aktif) untuk mencatat salat seketika tanpa memicu navigasi paksa browser.
  - *Rasional*: Memenuhi keinginan pengguna agar aplikasi tidak terbuka tiba-tiba saat menekan tombol "Sudah Salat".
- **Heningkan Azan Langsung dari Notifikasi**:
  - *Keputusan*: Service worker mengirim event pesan `SILENCE_AZAN` ke klien yang sedang memutar audio azan, dan menghentikan audio context seketika.
- **Pola Getar Haptic**:
  - *Keputusan*: Menambahkan properti `vibrate: [200, 100, 200, 100, 300, 100, 500]` pada seluruh pemicu notifikasi `showNotification()`.

---

## 4. Technical Architecture & Component Structure

```
┌──────────────────────────────────────────────────────────┐
│                   Browser / Service Worker               │
│                                                          │
│  Push Event / Cron Worker                                │
│       │                                                  │
│       ├──► showNotification(..., {                       │
│       │       actions: ['silence_azan', 'sudah_salat'],  │
│       │       vibrate: [200, 100, 200, 100, 300, ...],   │
│       │       sound: '/Assets/Adzan/Fardhu.mp3'          │
│       │    })                                            │
│       │                                                  │
│  notificationclick Event                                 │
│       │                                                  │
│       ├──► 'sudah_salat' ──► Record directly to storage  │
│       │                      without opening window!     │
│       └──► 'silence_azan' ─► Stop audio stream silently  │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                   React App State                        │
│                                                          │
│  PreAzanSetupModal (10 min / 30 min selector)            │
│  ReminderSettings (preReminderMinutes, autoAzanSound)    │
│  WidgetPage (Wallpaper Glass Pop-Out & PiP)              │
│  PatchNotes v2.10.0 (Admin Dashboard & Settings)         │
└──────────────────────────────────────────────────────────┘
```

---

## 5. Rencana Langkah Pengerjaan

1. **Service Worker (`public/sw.js`)**:
   - Perbaiki event listener `notificationclick` agar action `sudah_salat` dan `silence_azan` tidak lagi memanggil `self.clients.openWindow()` atau `client.focus()`.
   - Terapkan penyimpanan langsung ke `IndexedDB` dan sinkronisasi `postMessage` ke seluruh tab.
   - Tambahkan parameter `vibrate` pada seluruh `showNotification`.
   - Update aksi notifikasi azan: hilangkan tombol "Dengar Azan", ganti dengan "Heningkan Azan" dan "Tutup".

2. **Komponen Pengingat Pra-Azan (`PreAzanReminderModal.tsx`)**:
   - Buat modal khusus yang otomatis memeriksa apakah preferensi pra-azan sudah disetel.
   - Tampilkan opsi 10 Menit, 30 Menit, atau Nonaktif, serta sakelar azan otomatis.
   - Pasang di `Layout.tsx` atau `App.tsx` agar pengguna lama yang belum mendapatkan pengaturan ini langsung disajikan modal pembaruan.

3. **Logika Audio Azan & Client Listener (`src/lib/audio.ts` & `src/lib/push.ts`)**:
   - Sambungkan event `SILENCE_AZAN` agar audio azan yang sedang berputar langsung berhenti ketika pengguna menekan heningkan di notifikasi.
   - Pastikan suara azan otomatis berbunyi sesuai preferensi tanpa menunggu klik manual.

4. **Widget Wallpaper (`src/pages/WidgetPage.tsx` & `src/components/FloatingWidget.tsx`)**:
   - Sempurnakan mode pop-out wallpaper dengan kontrol transparansi glassmorphism dan Document Picture-in-Picture.
   - Pastikan widget dapat disimpan di wallpaper / beranda dengan nyaman.

5. **Pembaruan Versi ke v2.10.0**:
   - Update `CURRENT_VERSION = "2.10.0"` di `src/lib/storage.ts`.
   - Tambahkan item rilis `2.10.0` pada `APP_PATCH_NOTES` di `src/types.ts`.
   - Update menu dan tampilan patch notes di dashboard.

6. **Verifikasi & Build**:
   - Jalankan `compile_applet` dan `lint_applet` secara bersamaan untuk memastikan 0 error.
