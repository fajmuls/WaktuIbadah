# Rencana Implementasi Pembaruan Besar WaktuIbadah (v2.0.0)

Pembaruan ini merombak antarmuka aplikasi menjadi **Vibrant Memphis Classic Style** dengan warna cerah kontras tinggi, border tegas hitam, dan aksen geometris. Seluruh audio sistem dihubungkan langsung ke file lokal dari **Islamic Planner Audio Pack**, push & local notifications PWA dioptimalkan bekerja di latar belakang (background sync & service worker), serta nomor versi v2.0.0 ditampilkan secara terintegrasi di halaman Pengaturan dan Admin Dashboard lengkap dengan modal Patch Notes & Change Log.

---

## 1. Pemindahan & Integrasi Penuh Paket Audio Lokal
- **Salin & Tata Aset Audio**:
  - Salin seluruh file audio dari `/WaktuIbadah_Audio_Pack/Islamic_Planner_Audio_Pack/sound_effects/` dan background music ke direktori `/public/audio/`.
  - Berkas meliputi:
    - *UI Interactions*: `ui_button_tap.mp3`, `ui_toggle.mp3`, `ui_tab_switch.mp3`, `ui_save_success.mp3`, `ui_error.mp3`, `ui_delete.mp3`.
    - *Task & Schedule*: `task_completed.mp3`, `task_deadline_soon.mp3`, `task_deadline_urgent.mp3`, `task_overdue.mp3`, `schedule_created.mp3`, `schedule_reminder.mp3`, `schedule_start.mp3`.
    - *Ibadah & Quran*: `prayer_fajr.mp3`, `prayer_dhuhr.mp3`, `prayer_asr.mp3`, `prayer_maghrib.mp3`, `prayer_isha.mp3`, `prayer_imsak.mp3`, `prayer_completed.mp3`, `dhikr_counter_tap.mp3`, `quran_open.mp3`, `quran_bookmark_saved.mp3`, `quran_bookmark_removed.mp3`, `quran_reading_goal_complete.mp3`, `notification_general.mp3`.
    - *Ambient Loop*: `instrumental_ambient_islamic_90s_loop.mp3`.
- **Refaktor `src/lib/audio.ts`**:
  - Sediakan fungsi terspesialisasi yang mengeksekusi audio dengan latency rendah (HTMLAudioElement cache + Web Audio fallback):
    - `playButtonTapSound()`
    - `playToggleSound()`
    - `playTabSwitchSound()`
    - `playSaveSuccessSound()`
    - `playErrorSound()`
    - `playDeleteSound()`
    - `playTaskStateSound('completed' | 'soon' | 'urgent' | 'overdue')`
    - `playDhikrTapSound()`
    - `playPrayerSound(prayerName)`
  - Hubungkan ke click listener global dan setiap tombol aksi penting (Simpan, Hapus, Selesai, Switch Tab, Tasbih).

---

## 2. Redesain Menyeluruh: Vibrant Memphis Classic Style
- **Desain Fondasi & Tokens di Tailwind (`src/index.css`)**:
  - Palet Memphis berani: Yellow `#FFE600`, Vivid Pink `#FF4B91`, Electric Cyan `#00F0FF`, Purple `#8B5CF6`, Coral Orange `#FF6B35`, Emerald Green `#10B981`, Deep Black `#18181B`.
  - Garis batas tegas (2px hingga 3px solid black `border-2 border-black` / `border-[2.5px] border-black`).
  - Hard offset drop shadow (`shadow-[3px_3px_0px_#000]` & `shadow-[5px_5px_0px_#000]`).
  - Sudut agak membulat retro (`rounded-2xl` atau `rounded-xl` dengan border hitam kaku).
  - Interaktivitas taktil saat ditekan: `active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000] transition-all`.
  - Motif geometris aksen (stripes, dots, squiggles, badge pill kontras).
- **Perombakan Komponen Utama**:
  - **Sidebar & Mobile Navigation (`Layout.tsx`)**: Menggunakan tab Memphis dengan aksen warna cerah saat aktif, shadow kotak hitam, dan badge retro.
  - **Tombol & Kontrol**: Seluruh button di aplikasi (Tambah Jadwal, Checklist Salat, Mulai Sesi Fokus, Simpan Pengaturan, dll.) menggunakan gaya Memphis tactile yang khas.
  - **Cards & Modals**: Header modal dengan warna blok kontras, outline hitam, dan tombol close berbentuk lingkaran/persegi Memphis.

---

## 3. Optimasi PWA & Notifikasi Latar Belakang
- **Web Notifications API & Service Worker (`public/sw.js` & `src/lib/pwa-service.ts`)**:
  - Pastikan Service Worker terdaftar dengan scope penuh `/` dan menangani notifikasi push, notifikasi terjadwal, dan reminder alarm.
  - Tambahkan banner izin notifikasi yang ramah dan interaktif di beranda dan halaman Pengaturan.
  - Tangani skenario ketika tab Chrome di-minimize atau ditutup dengan memanfaatkan Service Worker `showNotification`, persistent alarm timer, dan vibration cadence (`[500, 200, 500, 200, 800]`).
  - Sediakan audio test play notifikasi langsung dari pengaturan PWA.

---

## 4. Sinkronisasi Firestore & Validasi Rules
- **Pemeriksaan Database Firestore**:
  - Pastikan konektivitas sync profil mahasiswa (`student_profiles`) multi-perangkat berbasis Nama + PIN 4 digit berjalan tanpa hambatan.
  - Verifikasi submission ulasan website (`website_reviews`) dan konfigurasi admin (`admin_config`).
  - Deploy `firestore.rules` melalui tool `deploy_firebase` untuk menjamin izin keamanan terbarui di cloud.

---

## 5. Pembaruan Versi Aplikasi (v2.0.0) & Modal Patch Notes
- **Informasi Versi di Pengaturan (`Settings.tsx`)**:
  - Perbarui nomor versi di `CURRENT_VERSION` menjadi **`v2.0.0`**.
  - Tampilkan kartu versi **WaktuIbadah v2.0.0 - Vibrant Memphis Edition** di halaman Pengaturan dengan tombol interaktif **"Lihat Catatan Pembaruan (Patch Notes)"**.
- **Admin Dashboard Integration (`AdminDashboard.tsx`)**:
  - Tambahkan tombol pintas di navigasi atas Admin Dashboard untuk membuka modal rilis v2.0.0 dan riwayat changelog.
  - Modal patch notes menampilkan ringkasan fitur baru (Memphis UI, New Audio Engine, PWA Push Notification, Multi-Device PIN Cloud Sync).

---

## 6. Verifikasi & Saran Pengembangan Selanjutnya
- Jalankan `compile_applet` untuk memastikan seluruh tipe TypeScript dan bundler Vite lulus tanpa error.
- Sertakan daftar rekomendasi dan saran update berikutnya (UI/UX, Quality of Life, dan optimasi performa) pada ringkasan akhir.
