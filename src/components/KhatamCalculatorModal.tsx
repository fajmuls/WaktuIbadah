import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Sparkles, BookOpen, Calendar, Clock, CheckCircle2, 
  TrendingUp, Award, RotateCcw, Plus, ChevronRight, AlertCircle 
} from 'lucide-react';
import { storage } from '../lib/storage';
import { QuranKhatamTarget, QuranLog } from '../types';
import { format, differenceInDays, addDays, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

interface KhatamCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogModal?: () => void;
}

const TOTAL_AYAT_QURAN = 6236;
const TOTAL_PAGES_QURAN = 604;
const TOTAL_JUZ_QURAN = 30;

export function KhatamCalculatorModal({ isOpen, onClose, onOpenLogModal }: KhatamCalculatorModalProps) {
  const [activeTarget, setActiveTarget] = useState<QuranKhatamTarget | null>(null);
  const [quranLogs, setQuranLogs] = useState<QuranLog[]>([]);
  
  // Form state for creating / updating target
  const [isEditing, setIsEditing] = useState(false);
  const [targetTitle, setTargetTitle] = useState('Khatam Al-Qur\'an 30 Hari');
  const [targetDays, setTargetDays] = useState(30);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    if (isOpen) {
      const saved = storage.getKhatamTarget();
      setActiveTarget(saved);
      setQuranLogs(storage.getQuranLogs());
      if (!saved) {
        setIsEditing(true);
      } else {
        setIsEditing(false);
      }
    }
  }, [isOpen]);

  // Calculate calculations
  const stats = useMemo(() => {
    if (!activeTarget) return null;

    const today = new Date();
    const start = parseISO(activeTarget.startDate);
    const end = parseISO(activeTarget.targetEndDate);

    // Filter logs read on or after target start date
    const relevantLogs = quranLogs.filter(q => q.date >= activeTarget.startDate);
    const totalAyatRead = relevantLogs.reduce((acc, q) => acc + (q.totalAyat || 0), 0);

    const daysPassed = Math.max(1, differenceInDays(today, start) + 1);
    const remainingDays = Math.max(0, differenceInDays(end, today) + 1);
    const totalTargetDays = activeTarget.targetDays;

    const remainingAyat = Math.max(0, TOTAL_AYAT_QURAN - totalAyatRead);
    const progressPercent = Math.min(100, Math.round((totalAyatRead / TOTAL_AYAT_QURAN) * 100));

    // Ideal pace: how many ayahs should have been read by today
    const idealAyatByToday = Math.round((TOTAL_AYAT_QURAN / totalTargetDays) * Math.min(daysPassed, totalTargetDays));
    const paceDiff = totalAyatRead - idealAyatByToday;

    // Daily required ayahs for the remaining days
    const dailyAyatNeeded = remainingDays > 0 
      ? Math.ceil(remainingAyat / remainingDays) 
      : remainingAyat;

    // Equivalent pages (~10.32 ayahs per page on average mushaf Madinah)
    const dailyPagesNeeded = (dailyAyatNeeded / 10.32).toFixed(1);
    const dailyJuzNeeded = (dailyAyatNeeded / (TOTAL_AYAT_QURAN / 30)).toFixed(2);

    let statusPace: 'ahead' | 'on_track' | 'behind' = 'on_track';
    if (paceDiff > 150) statusPace = 'ahead';
    else if (paceDiff < -150) statusPace = 'behind';

    return {
      totalAyatRead,
      remainingAyat,
      progressPercent,
      daysPassed: Math.min(daysPassed, totalTargetDays),
      remainingDays,
      dailyAyatNeeded,
      dailyPagesNeeded,
      dailyJuzNeeded,
      statusPace,
      paceDiff,
      isCompleted: totalAyatRead >= TOTAL_AYAT_QURAN,
    };
  }, [activeTarget, quranLogs]);

  const handleSaveTarget = () => {
    const start = parseISO(startDate);
    const end = addDays(start, targetDays - 1);
    const targetEndDate = format(end, 'yyyy-MM-dd');

    const newTarget: QuranKhatamTarget = {
      id: `khatam-${Date.now()}`,
      title: targetTitle.trim() || 'Target Khatam Al-Qur\'an',
      startDate,
      targetDays,
      targetType: 'ayat',
      totalUnits: TOTAL_AYAT_QURAN,
      targetEndDate,
      dailyTargetUnits: Math.ceil(TOTAL_AYAT_QURAN / targetDays),
      createdAt: new Date().toISOString(),
    };

    storage.setKhatamTarget(newTarget);
    setActiveTarget(newTarget);
    setIsEditing(false);
  };

  const handleApplyPreset = (days: number, title: string) => {
    setTargetDays(days);
    setTargetTitle(title);
  };

  const handleResetTarget = () => {
    if (confirm('Apakah kamu yakin ingin mereset target khatam saat ini?')) {
      storage.setKhatamTarget(null);
      setActiveTarget(null);
      setIsEditing(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-gray-100 dark:border-gray-700 shadow-2xl p-5 sm:p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                Kalkulator Target Khatam
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Estimasi ritme tilawah harian terhubung otomatis dengan log Al-Qur'an
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

        {/* MODE: EDIT / SETUP TARGET */}
        {isEditing ? (
          <div className="space-y-4">
            <div className="p-3 bg-teal-50/60 dark:bg-teal-950/40 rounded-2xl border border-teal-100 dark:border-teal-800 text-xs text-teal-900 dark:text-teal-200">
              <p className="font-bold flex items-center gap-1.5 mb-1">
                <BookOpen className="w-4 h-4 text-teal-600" />
                Formula Tilawah Khatam
              </p>
              Mushaf standar Al-Qur'an memuat <strong>30 Juz (604 halaman / 6.236 ayat)</strong>. Tentukan durasi target untuk menghitung porsi bacaan harian otomatis.
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                Pilihan Durasi Cepat (Preset):
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { days: 30, title: 'Khatam 30 Hari', sub: '1 Juz / 20 Halaman per hari' },
                  { days: 60, title: 'Khatam 60 Hari', sub: '0.5 Juz / 10 Halaman per hari' },
                  { days: 90, title: 'Khatam 90 Hari', sub: '1 Ruku\' / 7 Halaman per hari' },
                ].map(p => (
                  <button
                    key={p.days}
                    type="button"
                    onClick={() => handleApplyPreset(p.days, p.title)}
                    className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col justify-between ${
                      targetDays === p.days
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 ring-1 ring-teal-500'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xs font-bold">{p.title}</span>
                    <span className="text-[10px] text-gray-400 mt-1">{p.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Nama / Label Target:
                </label>
                <input 
                  type="text" 
                  value={targetTitle}
                  onChange={(e) => setTargetTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Total Hari Target:
                </label>
                <input 
                  type="number" 
                  min="5" 
                  max="365"
                  value={targetDays}
                  onChange={(e) => setTargetDays(Math.max(1, parseInt(e.target.value, 10) || 30))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Tanggal Mulai:
              </label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-teal-500"
              />
            </div>

            <div className="pt-2 flex gap-2">
              {activeTarget && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-2.5 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-200"
                >
                  Batal
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveTarget}
                className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                {activeTarget ? 'Simpan Perubahan Target' : 'Aktifkan Target Khatam'}
              </button>
            </div>
          </div>
        ) : stats ? (
          /* MODE: ACTIVE TARGET MONITORING */
          <div className="space-y-4">
            
            {/* Target Title & Date Banner */}
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/60 dark:to-emerald-950/60 p-4 rounded-3xl border border-teal-100 dark:border-teal-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/60 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Target Aktif
                  </span>
                  <h4 className="font-bold text-base text-gray-900 dark:text-white mt-1">
                    {activeTarget.title}
                  </h4>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-teal-700 dark:text-teal-300 font-bold hover:underline"
                >
                  Ubah
                </button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">
                    Hari ke-{stats.daysPassed} dari {activeTarget.targetDays} hari
                  </span>
                  <span className="font-bold text-teal-700 dark:text-teal-300">
                    {stats.progressPercent}% ({stats.totalAyatRead} / {TOTAL_AYAT_QURAN} Ayat)
                  </span>
                </div>
                <div className="w-full bg-white dark:bg-gray-800 h-3 rounded-full overflow-hidden border border-teal-200 dark:border-teal-800">
                  <div 
                    className="bg-teal-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(4, stats.progressPercent))}%` }}
                  />
                </div>
              </div>

              {/* Target Status Indicator */}
              <div className="flex items-center gap-2 pt-1">
                {stats.isCompleted ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Alhamdulillah! Target Khatam Al-Qur'an Telah Tercapai!
                  </div>
                ) : stats.statusPace === 'ahead' ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Luar biasa! Tilawahmu lebih cepat {stats.paceDiff} ayat dari ritme awal.
                  </div>
                ) : stats.statusPace === 'behind' ? (
                  <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 font-bold">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Perlu akselerasi: Tingkatkan porsi tilawah harianmu agar tepat waktu.
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-teal-700 dark:text-teal-300 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    Ritme tilawah sesuai jadwal target ({stats.remainingDays} hari tersisa).
                  </div>
                )}
              </div>
            </div>

            {/* Daily Requirement Card */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
              <h5 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Target Harian yang Diperlukan Mulai Hari Ini:
              </h5>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-teal-50 dark:bg-teal-950/60 rounded-xl border border-teal-100 dark:border-teal-800">
                  <p className="text-[10px] text-teal-700 dark:text-teal-300 font-semibold">Ayat per Hari</p>
                  <p className="text-lg font-bold text-teal-900 dark:text-white mt-0.5">
                    ~{stats.dailyAyatNeeded}
                  </p>
                  <p className="text-[9px] text-gray-400">Ayat / hari</p>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-100 dark:border-emerald-800">
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">Halaman per Hari</p>
                  <p className="text-lg font-bold text-emerald-900 dark:text-white mt-0.5">
                    ~{stats.dailyPagesNeeded}
                  </p>
                  <p className="text-[9px] text-gray-400">Lembar Mushaf</p>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-xl border border-blue-100 dark:border-blue-800">
                  <p className="text-[10px] text-blue-700 dark:text-blue-300 font-semibold">Juz per Hari</p>
                  <p className="text-lg font-bold text-blue-900 dark:text-white mt-0.5">
                    {stats.dailyJuzNeeded}
                  </p>
                  <p className="text-[9px] text-gray-400">Juz / hari</p>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                💡 <em>Tips pembagian waktu:</em> Kamu bisa membagi target <strong>~{stats.dailyPagesNeeded} halaman</strong> ini setelah tiap salat 5 waktu (sekitar {Math.ceil(parseFloat(stats.dailyPagesNeeded) / 5)} halaman setiap selesai salat fardhu).
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              {onOpenLogModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenLogModal();
                  }}
                  className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Catat Tilawah Selesai Hari Ini</span>
                </button>
              )}

              <button
                onClick={handleResetTarget}
                className="w-full py-2 px-4 text-gray-400 hover:text-red-500 dark:hover:text-red-400 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset / Hapus Target Ini</span>
              </button>
            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
}
