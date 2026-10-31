# Islamic Planner – Audio Pack

Paket audio orisinal untuk aplikasi pengingat ibadah dan pengelolaan jadwal. Semua audio dibuat instrumental/nonverbal; tidak ada adzan, lantunan ayat, atau suara manusia.

## Isi paket

### `sound_effects/`
- `prayer_fajr.mp3`, `prayer_dhuhr.mp3`, `prayer_asr.mp3`, `prayer_maghrib.mp3`, `prayer_isha.mp3`: nada pengingat salat dengan motif berbeda agar mudah dikenali.
- `prayer_imsak.mp3`, `prayer_completed.mp3`: imsak dan konfirmasi salat selesai.
- `quran_open.mp3`, `quran_bookmark_saved.mp3`, `quran_bookmark_removed.mp3`, `quran_reading_goal_complete.mp3`: interaksi Quran dan ayat favorit.
- `dhikr_counter_tap.mp3`: sentuhan penghitung zikir.
- `schedule_created.mp3`, `schedule_reminder.mp3`, `schedule_start.mp3`: jadwal dibuat, diingatkan, dan mulai.
- `task_deadline_soon.mp3`, `task_deadline_urgent.mp3`, `task_overdue.mp3`, `task_completed.mp3`: status tugas dan tenggat.
- `focus_session_start.mp3`, `focus_session_end.mp3`: awal/akhir sesi fokus.
- `ui_button_tap.mp3`, `ui_toggle.mp3`, `ui_tab_switch.mp3`, `ui_save_success.mp3`, `ui_error.mp3`, `ui_delete.mp3`: efek antarmuka.
- `notification_general.mp3`: notifikasi umum.

### `background_music/`
- `instrumental_ambient_islamic_90s_loop.mp3`: musik instrumental ambient 90 detik, bernuansa tenang dengan petikan senar, flute lembut, pad hangat, dan aksen perkusi sangat ringan. Dibuat agar bisa di-loop. Tidak memakai vokal.

## Saran volume

Efek UI (tap, toggle, tab) sebaiknya diputar pelan. Nada pengingat ibadah cukup jelas tetapi jangan terlalu keras. `task_deadline_urgent.mp3` dan `notification_general.mp3` adalah opsi yang lebih menonjol. Sesuaikan juga volume sistem dan pengaturan notifikasi perangkat.

## Catatan penting untuk notifikasi di HP

File audio ini menyediakan bunyi untuk aplikasi, tetapi tidak dapat memaksa browser melewati mode senyap, Do Not Disturb, atau volume sistem. Audio HTML biasa umumnya hanya dapat diputar saat halaman aktif dan setelah pengguna memberi izin/interaksi. Untuk pengingat ketika layar terkunci atau browser tidak aktif, gunakan PWA + Service Worker + Web Push; bunyi notifikasi latar tetap mengikuti dukungan dan pengaturan notifikasi Android/iOS/browser. Tidak semua browser mengizinkan situs menentukan file MP3 sebagai suara notifikasi sistem.

## Integrasi sederhana (halaman aktif)

```js
const prayerSound = new Audio('/audio/sound_effects/prayer_fajr.mp3');
prayerSound.preload = 'auto';

async function playPrayerReminder() {
  try {
    prayerSound.currentTime = 0;
    await prayerSound.play();
  } catch (error) {
    console.warn('Audio reminder could not play:', error);
  }
}
```

Sesuaikan path dengan folder aset aplikasi. Untuk suara yang berbeda, ganti nama file pada path audio.
