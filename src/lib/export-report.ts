import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { storage } from './storage';
import { PrayerLog, QuranLog } from '../types';

export interface ExportReportOptions {
  studentName: string;
  supervisorName?: string;
  range: 'week' | 'month' | '30days' | 'all';
  includeNotes?: boolean;
}

/**
 * Filter data based on selected range
 */
export function getReportData(range: 'week' | 'month' | '30days' | 'all') {
  const allPrayers = storage.getPrayerLogs();
  const allQuran = storage.getQuranLogs();
  const today = new Date();

  let startDate: Date;
  let endDate = today;

  if (range === 'week') {
    startDate = subDays(today, 6);
  } else if (range === 'month') {
    startDate = startOfMonth(today);
    endDate = endOfMonth(today);
  } else if (range === '30days') {
    startDate = subDays(today, 29);
  } else {
    // all time or default last 60 days
    if (allPrayers.length > 0) {
      const dates = allPrayers.map(p => new Date(p.date).getTime());
      startDate = new Date(Math.min(...dates));
    } else {
      startDate = subDays(today, 29);
    }
  }

  const daysInterval = eachDayOfInterval({ start: startDate, end: endDate });
  const prayerMap = new Map<string, PrayerLog>();
  allPrayers.forEach(p => prayerMap.set(p.date, p));

  const dailyRecords = daysInterval.map(d => {
    const dateStr = format(d, 'yyyy-MM-dd');
    const dayName = format(d, 'EEEE', { locale: id });
    const formattedDate = format(d, 'dd MMMM yyyy', { locale: id });

    const prayer = prayerMap.get(dateStr) || {
      date: dateStr,
      prayers: { Subuh: false, Zuhur: false, Asar: false, Magrib: false, Isya: false },
    };

    const quranDay = allQuran.filter(q => q.date === dateStr);
    const dayAyatCount = quranDay.reduce((acc, q) => acc + (q.totalAyat || 0), 0);

    const prayerCount = Object.values(prayer.prayers).filter(Boolean).length;
    const percentage = Math.round((prayerCount / 5) * 100);

    return {
      dateStr,
      dayName,
      formattedDate,
      prayer,
      prayerCount,
      percentage,
      quranDay,
      dayAyatCount,
    };
  });

  // Calculate Overall Statistics
  const totalDays = dailyRecords.length;
  const totalCompletedPrayers = dailyRecords.reduce((acc, r) => acc + r.prayerCount, 0);
  const maxPossiblePrayers = totalDays * 5;
  const prayerConsistency = maxPossiblePrayers > 0 
    ? Math.round((totalCompletedPrayers / maxPossiblePrayers) * 100) 
    : 0;

  const totalAyatRead = dailyRecords.reduce((acc, r) => acc + r.dayAyatCount, 0);
  const totalTilawahSessions = dailyRecords.reduce((acc, r) => acc + r.quranDay.length, 0);

  // Per prayer consistency
  const prayerCounts = {
    Subuh: dailyRecords.filter(r => r.prayer.prayers.Subuh).length,
    Zuhur: dailyRecords.filter(r => r.prayer.prayers.Zuhur).length,
    Asar: dailyRecords.filter(r => r.prayer.prayers.Asar).length,
    Magrib: dailyRecords.filter(r => r.prayer.prayers.Magrib).length,
    Isya: dailyRecords.filter(r => r.prayer.prayers.Isya).length,
  };

  let evaluationGrade = 'A (Sangat Baik / Mumtaz)';
  if (prayerConsistency < 60) {
    evaluationGrade = 'C (Perlu Ditingkatkan)';
  } else if (prayerConsistency < 80) {
    evaluationGrade = 'B (Baik / Jayyid)';
  }

  return {
    startDate: format(startDate, 'dd MMM yyyy', { locale: id }),
    endDate: format(endDate, 'dd MMM yyyy', { locale: id }),
    totalDays,
    dailyRecords,
    totalCompletedPrayers,
    maxPossiblePrayers,
    prayerConsistency,
    totalAyatRead,
    totalTilawahSessions,
    prayerCounts,
    evaluationGrade,
  };
}

/**
 * Download CSV Report formatted for Excel (UTF-8 BOM)
 */
export function downloadCSVReport(options: ExportReportOptions) {
  const data = getReportData(options.range);
  const nowStr = format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id });

  let csvContent = '\uFEFF'; // UTF-8 BOM for Microsoft Excel

  // Header Section
  csvContent += 'LAPORAN EVALUASI KEDISIPLINAN IBADAH & TILAWAH MAHASISWA\n';
  csvContent += 'Mata Kuliah: Pendidikan Agama Islam (PAI)\n';
  csvContent += `Nama Mahasiswa:,"${options.studentName}"\n`;
  if (options.supervisorName) {
    csvContent += `Dosen Pengampu / Pembimbing:,"${options.supervisorName}"\n`;
  }
  csvContent += `Periode Evaluasi:,"${data.startDate} s/d ${data.endDate} (${data.totalDays} Hari)"\n`;
  csvContent += `Waktu Unduh:,"${nowStr}"\n`;
  csvContent += `Aplikasi Pendukung:,"WaktuIbadah (Asisten Ibadah Mahasiswa)"\n\n`;

  // Summary Metrics Section
  csvContent += '--- RINGKASAN KEDISIPLINAN IBADAH ---\n';
  csvContent += `Tingkat Konsistensi Salat 5 Waktu:,"${data.prayerConsistency}% (${data.totalCompletedPrayers} dari ${data.maxPossiblePrayers} Waktu)"\n`;
  csvContent += `Predikat Evaluasi:,"${data.evaluationGrade}"\n`;
  csvContent += `Total Ayat Al-Qur'an Dibaca:,"${data.totalAyatRead} Ayat (${data.totalTilawahSessions} Sesi)"\n`;
  csvContent += `Subuh:,"${data.prayerCounts.Subuh}/${data.totalDays} (${Math.round((data.prayerCounts.Subuh / data.totalDays) * 100)}%)"\n`;
  csvContent += `Zuhur:,"${data.prayerCounts.Zuhur}/${data.totalDays} (${Math.round((data.prayerCounts.Zuhur / data.totalDays) * 100)}%)"\n`;
  csvContent += `Asar:,"${data.prayerCounts.Asar}/${data.totalDays} (${Math.round((data.prayerCounts.Asar / data.totalDays) * 100)}%)"\n`;
  csvContent += `Magrib:,"${data.prayerCounts.Magrib}/${data.totalDays} (${Math.round((data.prayerCounts.Magrib / data.totalDays) * 100)}%)"\n`;
  csvContent += `Isya:,"${data.prayerCounts.Isya}/${data.totalDays} (${Math.round((data.prayerCounts.Isya / data.totalDays) * 100)}%)"\n\n`;

  // Daily Prayer Table
  csvContent += '--- TABEL PRESENSI SALAT 5 WAKTU HARIAN ---\n';
  csvContent += 'No,Tanggal,Hari,Subuh,Zuhur,Asar,Magrib,Isya,Total Ditunaikan,Persentase\n';
  data.dailyRecords.forEach((r, idx) => {
    csvContent += `${idx + 1},"${r.formattedDate}","${r.dayName}",`;
    csvContent += `"${r.prayer.prayers.Subuh ? 'HADIR' : 'TIDAK'}",`;
    csvContent += `"${r.prayer.prayers.Zuhur ? 'HADIR' : 'TIDAK'}",`;
    csvContent += `"${r.prayer.prayers.Asar ? 'HADIR' : 'TIDAK'}",`;
    csvContent += `"${r.prayer.prayers.Magrib ? 'HADIR' : 'TIDAK'}",`;
    csvContent += `"${r.prayer.prayers.Isya ? 'HADIR' : 'TIDAK'}",`;
    csvContent += `"${r.prayerCount}/5","${r.percentage}%"\n`;
  });

  csvContent += '\n--- TABEL LOG TILAWAH AL-QUR\'AN ---\n';
  csvContent += 'No,Tanggal,Surah,Ayat Awal,Ayat Akhir,Jumlah Ayat,Catatan / Refleksi\n';
  
  let quranRow = 1;
  data.dailyRecords.forEach(r => {
    r.quranDay.forEach(q => {
      const cleanNote = (q.notes || '-').replace(/"/g, '""');
      csvContent += `${quranRow},"${r.formattedDate}","Surah ${q.surahName} (${q.surahNumber})",${q.startAyat},${q.endAyat},${q.totalAyat},"${cleanNote}"\n`;
      quranRow++;
    });
  });

  if (quranRow === 1) {
    csvContent += '-,Belum ada catatan tilawah Al-Qur\'an pada rentang waktu ini,-,-,-,-\n';
  }

  // Trigger Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const filename = `Laporan_Ibadah_${options.studentName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.csv`;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Open a Clean Printable Academic Evaluation Sheet ready for PDF Saving (window.print)
 */
export function openPrintableReport(options: ExportReportOptions) {
  const data = getReportData(options.range);
  const printWindow = window.open('', '_blank', 'width=900,height=800');

  if (!printWindow) {
    alert('Jendela popup diblokir oleh browser. Harap izinkan pop-up untuk mencetak laporan.');
    return;
  }

  const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: id });

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Evaluasi Ibadah & Tilawah - ${options.studentName}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1f2937;
      background: #ffffff;
      line-height: 1.4;
      margin: 0;
      padding: 24px;
      font-size: 12px;
    }
    .toolbar {
      position: sticky;
      top: 0;
      background: #f3f4f6;
      border-bottom: 2px solid #e5e7eb;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: -24px -24px 20px -24px;
    }
    .btn-print {
      background: #059669;
      color: white;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      font-size: 13px;
    }
    .btn-close {
      background: #e5e7eb;
      color: #374151;
      border: none;
      padding: 8px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
    }
    @media print {
      .toolbar { display: none !important; }
      body { padding: 0; }
      @page { margin: 15mm 10mm; }
    }
    .header-kop {
      text-align: center;
      border-bottom: 3px double #111827;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .header-kop h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #111827;
    }
    .header-kop h3 {
      margin: 4px 0 0 0;
      font-size: 13px;
      font-weight: 600;
      color: #065f46;
      text-transform: uppercase;
    }
    .header-kop p {
      margin: 3px 0 0 0;
      font-size: 10px;
      color: #6b7280;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
      background: #f9fafb;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    .meta-item { font-size: 11px; }
    .meta-label { color: #6b7280; font-size: 10px; }
    .meta-value { font-weight: bold; color: #111827; }
    
    .stats-card-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }
    .stats-card {
      border: 1px solid #d1fae5;
      background: #ecfdf5;
      padding: 8px 10px;
      border-radius: 6px;
      text-align: center;
    }
    .stats-num {
      font-size: 16px;
      font-weight: bold;
      color: #065f46;
    }
    .stats-sub {
      font-size: 9px;
      color: #047857;
      font-weight: 600;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 10.5px;
    }
    th, td {
      border: 1px solid #d1d5db;
      padding: 5px 6px;
      text-align: left;
    }
    th {
      background: #f3f4f6;
      font-weight: 700;
      color: #374151;
      text-align: center;
    }
    td.center { text-align: center; }
    .status-check {
      color: #059669;
      font-weight: bold;
    }
    .status-cross {
      color: #9ca3af;
    }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      color: #111827;
      margin: 14px 0 6px 0;
      display: flex;
      justify-content: space-between;
    }

    .signatures {
      margin-top: 30px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      text-align: center;
      page-break-inside: avoid;
    }
    .sig-box {
      padding: 0 20px;
    }
    .sig-space {
      height: 60px;
    }
    .sig-name {
      font-weight: bold;
      border-bottom: 1px solid #111827;
      display: inline-block;
      min-width: 180px;
      padding-bottom: 2px;
    }
    .sig-sub {
      font-size: 10px;
      color: #6b7280;
      margin-top: 2px;
    }
  </style>
</head>
<body>

  <div class="toolbar">
    <div>
      <span style="font-weight: bold; font-size: 13px; color: #111827;">Pratinjau Cetak Lembar Evaluasi Ibadah PAI</span>
      <span style="font-size: 11px; color: #6b7280; margin-left: 8px;">(Format Resmi Portofolio Mahasiswa)</span>
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn-print" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
      <button class="btn-close" onclick="window.close()">Tutup</button>
    </div>
  </div>

  <div class="header-kop">
    <h2>LEMBAR EVALUASI KEDISIPLINAN IBADAH & TILAWAH MAHASISWA</h2>
    <h3>MATA KULIAH PENDIDIKAN AGAMA ISLAM (PAI)</h3>
    <p>Aplikasi Asisten Waktu & Ibadah: WaktuIbadah (PWA) • Diverifikasi Melalui Catatan Presensi Mandiri</p>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <div class="meta-label">NAMA MAHASISWA</div>
      <div class="meta-value">${options.studentName}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">PERIODE EVALUASI</div>
      <div class="meta-value">${data.startDate} s/d ${data.endDate} (${data.totalDays} Hari)</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">DOSEN PENGAMPU / EVALUATOR</div>
      <div class="meta-value">${options.supervisorName || 'Dosen Pembimbing PAI'}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">TANGGAL PENERBITAN</div>
      <div class="meta-value">${currentDate}</div>
    </div>
  </div>

  <div class="stats-card-grid">
    <div class="stats-card">
      <div class="stats-num">${data.prayerConsistency}%</div>
      <div class="stats-sub">Konsistensi Salat</div>
    </div>
    <div class="stats-card">
      <div class="stats-num">${data.totalCompletedPrayers} / ${data.maxPossiblePrayers}</div>
      <div class="stats-sub">Waktu Salat Terpenuhi</div>
    </div>
    <div class="stats-card">
      <div class="stats-num">${data.totalAyatRead}</div>
      <div class="stats-sub">Total Ayat Al-Qur'an</div>
    </div>
    <div class="stats-card">
      <div class="stats-num">${data.evaluationGrade.split(' ')[0]}</div>
      <div class="stats-sub">Predikat: ${data.evaluationGrade}</div>
    </div>
  </div>

  <div class="section-title">
    <span>1. REKAPITULASI PRESENSI SALAT 5 WAKTU</span>
    <span style="font-size: 10px; color: #6b7280;">Subuh: ${data.prayerCounts.Subuh} • Zuhur: ${data.prayerCounts.Zuhur} • Asar: ${data.prayerCounts.Asar} • Magrib: ${data.prayerCounts.Magrib} • Isya: ${data.prayerCounts.Isya}</span>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 25px;">No</th>
        <th>Hari / Tanggal</th>
        <th style="width: 50px;">Subuh</th>
        <th style="width: 50px;">Zuhur</th>
        <th style="width: 50px;">Asar</th>
        <th style="width: 50px;">Magrib</th>
        <th style="width: 50px;">Isya</th>
        <th style="width: 60px;">Total</th>
        <th style="width: 55px;">Skor</th>
      </tr>
    </thead>
    <tbody>
      ${data.dailyRecords.map((r, i) => `
        <tr>
          <td class="center">${i + 1}</td>
          <td>${r.dayName}, ${r.formattedDate}</td>
          <td class="center ${r.prayer.prayers.Subuh ? 'status-check' : 'status-cross'}">${r.prayer.prayers.Subuh ? '✓' : '-'}</td>
          <td class="center ${r.prayer.prayers.Zuhur ? 'status-check' : 'status-cross'}">${r.prayer.prayers.Zuhur ? '✓' : '-'}</td>
          <td class="center ${r.prayer.prayers.Asar ? 'status-check' : 'status-cross'}">${r.prayer.prayers.Asar ? '✓' : '-'}</td>
          <td class="center ${r.prayer.prayers.Magrib ? 'status-check' : 'status-cross'}">${r.prayer.prayers.Magrib ? '✓' : '-'}</td>
          <td class="center ${r.prayer.prayers.Isya ? 'status-check' : 'status-cross'}">${r.prayer.prayers.Isya ? '✓' : '-'}</td>
          <td class="center" style="font-weight: bold;">${r.prayerCount} / 5</td>
          <td class="center">${r.percentage}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="section-title">
    <span>2. CATATAN TILAWAH AL-QUR'AN HARIAN</span>
    <span style="font-size: 10px; color: #6b7280;">Total: ${data.totalAyatRead} Ayat (${data.totalTilawahSessions} Sesi Tilawah)</span>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 25px;">No</th>
        <th style="width: 110px;">Tanggal</th>
        <th>Surah</th>
        <th style="width: 80px;">Rentang Ayat</th>
        <th style="width: 70px;">Jumlah Ayat</th>
        <th>Catatan / Tadabbur</th>
      </tr>
    </thead>
    <tbody>
      ${(() => {
        let rows = '';
        let rowIdx = 1;
        data.dailyRecords.forEach(r => {
          r.quranDay.forEach(q => {
            rows += `
              <tr>
                <td class="center">${rowIdx++}</td>
                <td>${r.formattedDate}</td>
                <td style="font-weight: 600;">Surah ${q.surahName} (${q.surahNumber})</td>
                <td class="center">Ayat ${q.startAyat} - ${q.endAyat}</td>
                <td class="center" style="font-weight: bold; color: #065f46;">+${q.totalAyat} Ayat</td>
                <td style="font-style: italic; color: #4b5563;">${q.notes || '-'}</td>
              </tr>
            `;
          });
        });
        if (rowIdx === 1) {
          rows = '<tr><td colspan="6" class="center" style="padding: 12px; color: #9ca3af;">Tidak ada catatan tilawah pada periode yang dipilih.</td></tr>';
        }
        return rows;
      })()}
    </tbody>
  </table>

  <div class="signatures">
    <div class="sig-box">
      <div class="sig-sub">Mengetahui,</div>
      <div class="sig-sub">Dosen Pengampu / Pembimbing PAI</div>
      <div class="sig-space"></div>
      <div class="sig-name">${options.supervisorName || '( ..................................................... )'}</div>
      <div class="sig-sub">NIP / NIDN</div>
    </div>
    <div class="sig-box">
      <div class="sig-sub">${currentDate}</div>
      <div class="sig-sub">Mahasiswa yang Bersangkutan</div>
      <div class="sig-space"></div>
      <div class="sig-name">${options.studentName}</div>
      <div class="sig-sub">NIM Mahasiswa</div>
    </div>
  </div>

</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
