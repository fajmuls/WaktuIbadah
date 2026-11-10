# Rencana Implementasi: Perombakan UI Kalender Sage-Zamrud, Jadwal Rutin, Pencatatan Jam Salat, Analitik Ibadah & Pembersihan Data Firebase

Rencana ini mencakup perombakan total UI Kalender & Penjadwalan dengan estetika **Hijau Sage, Aksen Zamrud & Memphis Border Tegas**, pencatatan **timestamp jam pengerjaan salat** (otomatis + edit manual), **grafik analitik tren ketepatan waktu & ibadah sunnah**, serta pembersihan data responden dummy dari Firestore.

---

## User Review & Critical Decisions

> [!IMPORTANT] Keputusan yang Telah Dikonfirmasi Pengguna:
> - **Nuansa Warna & Gaya Kalender**: Palette Hijau Sage (`bg-emerald-50/sage`), Aksen Hijau Zamrud (`emerald-600/700`), dan batas/border hitam tegas khas Memphis (`border-[1.5px] border-black shadow-[2px_2px_0px_#121212]`). Tanggal terlewat (past dates) memiliki warna latar khusus yang membedakan hari terlewat vs hari ini vs masa depan.
> - **Pencatatan Jam Salat**: Saat tombol/checklist salat dicentang, jam pengerjaan (`HH:mm`) otomatis tercatat sesuai waktu server/lokal, dan pengguna dapat mengetuk jam tersebut untuk melakukan edit manual bila baru sempat mencatatnya.
> - **Grafik Analitik Detail**: Halaman Progress/Analitik akan menampilkan grafik sebaran jam pengerjaan salat, tren ketepatan waktu (Awal Waktu vs Tepat Waktu vs Terakhir), serta konsistensi ibadah sunnah (Dhuha & Tahajud) dan tilawah Al-Qur'an.
> - **Pembersihan Firestore Dummy**: Menghapus total sisa dokumen dummy/responden lama (seperti Nadia Putri, Rian Hidayat, Ahmad Fauzi, Siti Nurhaliza) dari Firestore dan lokal agar hanya data responden/mahasiswa asli yang tampil di Admin Dashboard.

---

## 1. Overview & Core Concept

1. **Kalender Ibadah Berwarna Sage-Zamrud**:
   - Kotak tanggal berukuran proporsional (kompak, tidak terlalu kaku/besar) dengan hierarki warna:
     - **Masa Lalu (Terlewat)**: Latar hijau sage redup/terstruktur dengan indikator keterisian salat (misal 5/5 hijau zamrud, 1-4/5 sage transparan, atau merah muda bila 0/5).
     - **Hari Ini (`KINI`)**: Aksen zamrud dengan ring hitam tegas & lencana `KINI`.
     - **Masa Depan**: Latar putih-sage bersih dengan border subtle.
     - **Ikon & Indikator**: Bintang emas (⭐) untuk Dhuha, ikon Al-Qur'an (📖) untuk tilawah, dan titik biru untuk agenda kuliah.

2. **UI Halaman Jadwal & Template Rutin 1-Klik**:
   - Desain ulang kartu template rutin harian (Rutin Dhuha, Rutin Tilawah, Rutin Tahajud) mengikuti tema Memphis (border hitam 1.5px, aksen sage-zamrud-kuning, tombol aksional yang reponsif di smartphone).
   - Kalender mini/strip navigasi tanggal di halaman Jadwal diselaraskan dengan gaya UI utama.

3. **Detail Waktu Salat & Edit Jam Manual**:
   - Memperbarui `PrayerLog` schema untuk menyimpan `prayerTimesRecords?: Record<string, string>` (misal `Subuh: "04:35"`, `Dhuha: "08:15"`).
   - Saat dicentang, jam waktu saat ini otomatis terisi. Di bagian rincian, pengguna dapat memilih "Ubah Jam" melalui picker jam sederhana.

4. **Grafik Analitik Trend & Ketepatan Waktu**:
   - Menambahkan Visualisasi Chart (Bar/Area/Line) di halaman Progress:
     - **Sebaran Jam Salat**: Menunjukkan jam berapa pengguna biasa menunaikan Subuh, Zuhur, Asar, Magrib, Isya.
     - **Tren Ketepatan Waktu**: Persentase Awal Waktu vs Tepat Waktu.
     - **Statistik Ibadah Sunnah & Tilawah**: Rekap bulanan Dhuha, Tahajud, dan lembar tilawah.

5. **Pembersihan Responden Firebase Firestore**:
   - Menjalankan fungsi pembersihan massal (auto-clean script/method) untuk menghapus dokumen review atau profile dummy yang menggunakan ID `seed-rev-*` atau nama template lama di database Firestore `website_reviews` & `student_profiles`.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Mencentang Ibadah & Mengedit Jam**:
   - Pengguna membuka Dashboard / Ibadah $\rightarrow$ Mencentang Salat Subuh $\rightarrow$ Sistem mencatat pengerjaan pada jam `04:32 WIB` $\rightarrow$ Pengguna mengetuk chip jam untuk menyesuaikan ke `04:25 WIB` bila perlu $\rightarrow$ Data otomatis tersinkron ke Cloud Firestore.
2. **Melihat Kalender Sage-Zamrud**:
   - Pengguna membuka halaman Kalender $\rightarrow$ Melihat visualisasi sebulan penuh dengan kotak-kotak tanggal sage-zamrud yang rapi $\rightarrow$ Tanggal lalu yang 5/5 berwarna zamrud penuh, tanggal dengan Dhuha berhiaskan bintang emas, tanggal terlewat 0/5 bernuansa bergaris halus $\rightarrow$ Ketuk tanggal untuk melihat rincian jam salat & agenda.
3. **Menggunakan Template Jadwal Rutin**:
   - Pengguna membuka Halaman Jadwal $\rightarrow$ Mengetuk "Rutin Dhuha 08:30" pada kartu Memphis Sage $\rightarrow$ Jadwal rutin 7 hari otomatis terbuat dengan feedback audio taktil.
4. **Melihat Analitik Detail**:
   - Pengguna membuka Progress $\rightarrow$ Melihat grafik sebaran jam salat harian dan tren konsistensi pengerjaan Dhuha & Tahajud sepanjang minggu/bulan.

### Visual Identity & Color Palette (Sage-Zamrud Memphis)
- **Canvas Base**: `#F8FAF6` (White-Sage Warm) / Dark `#0F1715`.
- **Sage Neutral Surface**: `#E2E8DF` (Sage Muted) / `#1E2925` (Dark Sage).
- **Emerald Accent**: `#10B981` / `#059669` (Zamrud Active).
- **Golden Accent**: `#F59E0B` / `#FBBF24` (Sunnah Dhuha Star).
- **Border Style**: `border-[1.5px] border-[#121212] shadow-[2px_2px_0px_#121212]` (Khas Memphis Design System).

---

## 3. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React Application View                          │
│                                                                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │ Kalender (Sage)  │  │ Jadwal & Template│  │ Progress (Analytics) │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────────┬───────────┘  │
└───────────┼─────────────────────┼───────────────────────┼──────────────┘
            │                     │                       │
            ▼                     ▼                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          Storage & State Manager                       │
│  - storage.togglePrayer(date, key, customTime?)                        │
│  - storage.getPrayerLog(date) -> includes prayerTimesRecords           │
│  - storage.getSchedules() & addRoutineSchedule()                       │
│  - storage.cleanDummyFirestoreData()                                   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Firebase Firestore Database                       │
│  - student_profiles/{profileId} (user data + prayerTimesRecords)       │
│  - website_reviews/{reviewId} (clean real reviews only)               │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Schema Enhancements (`src/types.ts`)
```typescript
export interface PrayerLog {
  date: string; // YYYY-MM-DD
  prayers: Record<PrayerName, boolean>;
  prayerTimesRecords?: Record<string, string>; // HH:mm timestamp for each prayer
  sunnahPrayers?: {
    Dhuha?: boolean;
    Tahajud?: boolean;
    Witir?: boolean;
    [key: string]: boolean | undefined;
  };
  sunnahTimesRecords?: Record<string, string>; // HH:mm timestamp for sunnah
}
```

---

## 4. Implementation Steps

1. **Data Model & Storage (`src/types.ts` & `src/lib/storage.ts`)**:
   - Tambahkan `prayerTimesRecords` & `sunnahTimesRecords` pada `PrayerLog`.
   - Perbarui `togglePrayer` agar otomatis mengisi jam `format(new Date(), 'HH:mm')` jika belum ada, serta fungsi `updatePrayerTime(date, prayerKey, timeStr)`.
   - Buat fungsi pembersih `cleanFirestoreDummyData()` yang memanggil `deleteDoc` untuk dokumen review `seed-rev-*` dan akun dummy lama di Firestore.

2. **UI Kalender Sage-Zamrud (`MonthlyCalendarGrid.tsx` & `Kalender.tsx`)**:
   - Rombak grid tanggal agar berukuran kompak (`h-10 sm:h-11`), dengan kelas latar sage-zamrud yang bervariasi untuk:
     - Tanggal terlewat (5/5 zamrud penuh, 1-4/5 sage, 0/5 abu-sage).
     - Hari ini (`border-2 border-[#121212] ring-2 ring-emerald-400`).
     - Bintang Dhuha (⭐), penanda Tilawah (📖), dan titik agenda.
   - Tampilkan rincian jam pengerjaan salat (`Subuh dicentang jam 04:30`) di kartu inspeksi harian.

3. **UI Jadwal & Routine Cards Overhaul (`Jadwal.tsx`)**:
   - Restyle kartu template rutin 1-klik dengan Memphis Sage-Zamrud styling.
   - Restyle strip kalender horizontal halaman Jadwal agar serasi dengan sistem desain utama.

4. **Detail Analytics & Grafik Jam Salat (`Progress.tsx`)**:
   - Tambahkan komponen chart Recharts/custom SVG untuk:
     - Distribusi jam pengerjaan salat fardhu.
     - Grafik tren konsistensi Dhuha, Tahajud & Tilawah harian/mingguan.

5. **Pembersihan Massal Firestore (`cloud-sync.ts` & `AdminDashboard.tsx`)**:
   - Eksekusi pembersihan otomatis pada Firestore agar data `website_reviews` dan `student_profiles` di cloud bersih dari dokumen dummy.

6. **Pembaruan Versi**:
   - Naikkan versi aplikasi ke **v2.13.0** dengan rincian patch note lengkap.
