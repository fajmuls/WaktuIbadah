# Panduan Mengaktifkan Notifikasi Salat (Web Push) - WaktuIbadah

## Cara kerja singkat
Sebelumnya alarm dijalankan oleh `setInterval` di dalam halaman, sehingga berhenti begitu aplikasi ditutup.
Sekarang:

```
Cron (tiap menit) -> /api/cron/dispatch -> kirim Web Push (VAPID) -> sw.js menampilkan notifikasi
                                   ^
              Firestore: push_subscriptions (langganan + preferensi + jadwal per perangkat)
```

## Langkah pemasangan (urut)

1. **Pasang dependensi**: `npm install`
2. **Buat kunci VAPID**: `npm run vapid`, salin hasilnya.
3. **Service account Firebase**: Firebase Console > Project settings > Service accounts > *Generate new private key*.
   Isi file JSON-nya dipakai sebagai `FIREBASE_SERVICE_ACCOUNT`.
4. **Isi Environment Variables di Vercel** (Settings > Environment Variables), lihat `.env.example`:
   `VITE_VAPID_PUBLIC_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`,
   `FIREBASE_SERVICE_ACCOUNT`, `FIRESTORE_DATABASE_ID`, `CRON_SECRET`, `ADMIN_TOKEN`.
5. **Deploy ulang** proyek di Vercel (variabel `VITE_...` hanya terbaca saat build).
6. **Penjadwal tiap menit** (wajib; cron bawaan Vercel paket gratis hanya sehari sekali).
   Daftar gratis di cron-job.org lalu buat job:
   - URL: `https://waktuibadah.vercel.app/api/cron/dispatch`
   - Jadwal: setiap 1 menit
   - Header: `Authorization: Bearer <isi CRON_SECRET>`
   Balasan sukses berbentuk `{"ok":true,"checked":0,"sent":0,...}`.
7. **(Terakhir) Deploy aturan Firestore**: `firebase deploy --only firestore:rules`
   (menutup akses klien ke `push_subscriptions` dan `prayer_cache`).

## Uji coba
- Android/PC (Chrome): buka situs > Pengaturan > **Aktifkan Notifikasi** > **Uji Notifikasi dari Server**. Tutup aplikasi, pesan uji tetap datang.
- iPhone/iPad (iOS 16.4+): Safari > Bagikan > **Tambah ke Layar Utama** > buka dari ikon > aktifkan notifikasi.
- Notifikasi azan sungguhan: tunggu waktu salat berikutnya setelah cron berjalan.

## Batasan yang perlu diketahui
- **Suara azan penuh tidak bisa diputar otomatis dari notifikasi web.** Notifikasi memakai nada bawaan HP. Azan penuh hanya diputar bila aplikasi sedang terbuka.
- **Getar** hanya didukung di Android. iPhone tidak mendukung getar pada notifikasi web.
- **"Bisukan suara"** mematikan suara DAN getar (aturan platform web). Untuk getar saja, atur HP ke mode getar.
- Beberapa HP (Xiaomi, Oppo, Vivo, Samsung) menunda notifikasi bila baterai dibatasi: set aplikasi ke "Tanpa batasan".
- Firestore gratis (Spark) cukup untuk skala tugas kuliah; dispatch hanya membaca langganan yang jatuh tempo.

## Dashboard Admin
Token admin kini diperiksa server (`ADMIN_TOKEN`), tidak lagi tertulis di kode. Panel **Pengguna Terdaftar** menampilkan
nama, kota, mulai memakai, aktif terakhir, lama memakai, ibadah/tugas/jadwal, status notifikasi, dan ulasan per pengguna.
PIN tidak pernah dikirim ke browser.

## Risiko keamanan yang MASIH ada (belum diubah)
- `student_profiles` masih bisa dibaca siapa pun yang tahu/menebak nama (termasuk PIN 4 digit yang tersimpan polos), karena aplikasi belum memakai Firebase Auth.
  Langkah lanjutan: pindahkan sinkron profil ke API server dengan PIN di-hash, atau pakai Firebase Anonymous Auth + aturan per-pengguna.
- Koleksi `website_reviews` dan `admin_config` masih bisa ditulis/dihapus dari klien.
- Token admin lama sempat tertulis di kode sumber; anggap sudah bocor dan jangan dipakai lagi.

## Uji logika penjadwalan (tanpa jaringan)
`npm run test:push`
