import React, { useState } from 'react';
import { 
  X, Download, Printer, FileSpreadsheet, Calendar, User, 
  Award, CheckCircle2, ShieldCheck, BookOpen, Heart, Sparkles 
} from 'lucide-react';
import { storage } from '../lib/storage';
import { downloadCSVReport, openPrintableReport, getReportData } from '../lib/export-report';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportReportModal({ isOpen, onClose }: ExportReportModalProps) {
  const user = storage.getUser();
  const [studentName, setStudentName] = useState(user?.name || 'Mahasiswa');
  const [supervisorName, setSupervisorName] = useState('');
  const [range, setRange] = useState<'week' | 'month' | '30days' | 'all'>('month');

  if (!isOpen) return null;

  const data = getReportData(range);

  const handleExportCSV = () => {
    downloadCSVReport({
      studentName: studentName.trim() || 'Mahasiswa',
      supervisorName: supervisorName.trim() || undefined,
      range,
    });
  };

  const handlePrintPDF = () => {
    openPrintableReport({
      studentName: studentName.trim() || 'Mahasiswa',
      supervisorName: supervisorName.trim() || undefined,
      range,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-gray-100 dark:border-gray-700 shadow-2xl p-5 sm:p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-2xl flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                Ekspor Laporan Ibadah (PAI)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Format resmi portofolio evaluasi Pendidikan Agama Islam
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Rentang Periode */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            Pilih Rentang Waktu Laporan:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'week', label: '7 Hari Terakhir' },
              { id: 'month', label: 'Bulan Ini' },
              { id: '30days', label: '30 Hari' },
              { id: 'all', label: 'Seluruh Riwayat' },
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRange(item.id as any)}
                className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-center ${
                  range === item.id
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Nama & Dosen */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              Nama Lengkap Mahasiswa:
            </label>
            <input 
              type="text" 
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Contoh: Muhammad Raihan"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              Dosen Pengampu / Pembimbing PAI (Opsional):
            </label>
            <input 
              type="text" 
              value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)}
              placeholder="Contoh: Dr. H. Ahmad Fauzi, M.Ag"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Live Preview Metric Summary Card */}
        <div className="p-3.5 bg-gray-50 dark:bg-gray-900/60 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Pratinjau Data yang Akan Dicetak:
            </span>
            <span className="text-[11px] text-gray-400">
              {data.startDate} - {data.endDate}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <p className="text-[10px] text-gray-400">Konsistensi Salat</p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {data.prayerConsistency}%
              </p>
            </div>
            <div className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <p className="text-[10px] text-gray-400">Total Salat</p>
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                {data.totalCompletedPrayers} / {data.maxPossiblePrayers}
              </p>
            </div>
            <div className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <p className="text-[10px] text-gray-400">Total Tilawah</p>
              <p className="text-sm font-bold text-teal-600 dark:text-teal-400 mt-0.5">
                {data.totalAyatRead} <span className="text-[10px] font-normal">Ayat</span>
              </p>
            </div>
          </div>

          <p className="text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Predikat Capaian: <strong>{data.evaluationGrade}</strong>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handlePrintPDF}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Buka Lembar Cetak / Simpan PDF Resmi</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="w-full py-2.5 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Unduh File Spreadsheet Excel (CSV)</span>
          </button>
        </div>

        <p className="text-[10px] text-center text-gray-400">
          Format laporan mencakup tabel kehadiran salat 5 waktu per hari, catatan ayat tilawah, dan kolom tanda tangan pengesahan dosen & mahasiswa.
        </p>

      </div>
    </div>
  );
}
