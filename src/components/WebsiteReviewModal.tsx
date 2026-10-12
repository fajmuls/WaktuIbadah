import React, { useState, useEffect } from 'react';
import { Star, Award, CheckCircle2, X, Send, ExternalLink, ThumbsUp, Lock } from 'lucide-react';
import { storage } from '../lib/storage';
import { StarRatingValue, WebsiteReview } from '../types';
import { vibrateSuccess } from '../lib/audio';

const STAR_LABELS: Record<StarRatingValue, 'Tidak Membantu' | 'Kurang Membantu' | 'Cukup Membantu' | 'Membantu' | 'Sangat Membantu'> = {
  1: 'Tidak Membantu',
  2: 'Kurang Membantu',
  3: 'Cukup Membantu',
  4: 'Membantu',
  5: 'Sangat Membantu',
};

interface WebsiteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WebsiteReviewModal: React.FC<WebsiteReviewModalProps> = ({ isOpen, onClose }) => {
  const [user, setUser] = useState(storage.getUser());
  const [adminConfig, setAdminConfig] = useState(storage.getAdminReviewConfig());
  const [userName, setUserName] = useState('');
  const [rating, setRating] = useState<StarRatingValue>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [prayerAspect, setPrayerAspect] = useState<number>(5);
  const [scheduleAspect, setScheduleAspect] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const u = storage.getUser();
    setUser(u);
    if (u?.name) {
      setUserName(u.name);
    }
    setAdminConfig(storage.getAdminReviewConfig());
  }, [isOpen]);

  if (!isOpen || !adminConfig.isEnabled) return null;

  const currentDisplayRating = (hoverRating || rating) as StarRatingValue;
  const ratingText = STAR_LABELS[currentDisplayRating] || 'Sangat Membantu';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = user?.name?.trim() || 'Mahasiswa';
    const review: WebsiteReview = {
      id: 'rev-' + Date.now(),
      userName: finalName,
      rating: rating,
      ratingLabel: STAR_LABELS[rating],
      comment: comment.trim() || 'Aplikasi sangat bermanfaat untuk perkuliahan dan ibadah.',
      prayerAspectRating: prayerAspect,
      scheduleAspectRating: scheduleAspect,
      submittedAt: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0]
    };

    storage.addWebsiteReview(review);
    localStorage.setItem('wi_five_prayers_reviewed', 'true');
    localStorage.setItem('wi_rating_submitted', 'true');
    vibrateSuccess();
    setIsSubmitted(true);

    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 2000);
  };

  const handleDismissForever = () => {
    localStorage.setItem('wi_five_prayers_reviewed', 'true');
    onClose();
  };

  // If Admin set review mode to GForm only
  if (adminConfig.reviewMode === 'gform') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-emerald-100 dark:border-emerald-900/40 space-y-4 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 font-bold text-xl">
              🎉
            </div>
            <button onClick={handleDismissForever} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Sholat 5 Waktu Tuntas
            </span>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mt-1">
              Alhamdulillah! Salat 5 Waktu Hari Ini Lengkap!
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
              {adminConfig.description || 'Bantu kami mengevaluasi efektivitas website ini untuk proyek PAI dengan mengisi formulir kuesioner Google Form.'}
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <a
              href={adminConfig.gformUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDismissForever}
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Beri Ulasan di Google Form</span>
            </a>
            <button
              onClick={handleDismissForever}
              className="py-2.5 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl text-xs font-semibold"
            >
              Nanti Saja
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-emerald-100 dark:border-emerald-900/40 space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        
        {isSubmitted ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Terima Kasih Banyak!
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
              Ulasan bintang Anda telah tersimpan dan dikonversi ke grafik laporan Admin Dashboard proyek.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center font-bold text-lg shadow-md shadow-amber-400/30">
                  ⭐
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                    Pencapaian Salat 5 Waktu Hari Ini!
                  </span>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Ulasan Efektivitas Aplikasi
                  </h3>
                </div>
              </div>

              <button
                onClick={handleDismissForever}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl"
                title="Tutup ulasan"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Alhamdulillah, Anda telah menuntaskan salat 5 waktu hari ini! Apakah aplikasi WaktuIbadah membantu Anda menjaga ibadah dan mengelola jadwal perkuliahan?
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Nama Responden (Terkunci Sesuai Akun Mahasiswa) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Nama Mahasiswa (Terkunci Sesuai Akun Awal)
                </label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200">
                  <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{user?.name || 'Mahasiswa'}</span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold ml-auto bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/50 dark:border-emerald-800/50">
                    Akun Terdaftar
                  </span>
                </div>
              </div>

              {/* 5-STAR RATING SELECTION */}
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                <span className="text-xs font-bold text-emerald-950 dark:text-emerald-100 block">
                  Beri Rating Keseluruhan Aplikasi (1 - 5 Bintang)
                </span>
                
                <div className="flex items-center justify-center gap-2 py-1">
                  {([1, 2, 3, 4, 5] as StarRatingValue[]).map((starVal) => {
                    const isFilled = (hoverRating || rating) >= starVal;
                    return (
                      <button
                        type="button"
                        key={starVal}
                        onMouseEnter={() => setHoverRating(starVal)}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => {
                          setRating(starVal);
                          vibrateSuccess();
                        }}
                        className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-hidden active:scale-95"
                      >
                        <Star
                          className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                            isFilled
                              ? 'text-amber-400 fill-amber-400 filter drop-shadow'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Rating Label Indicator */}
                <div className="inline-block px-3 py-1 rounded-full bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-700 shadow-2xs">
                  <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                    Bintang {currentDisplayRating}: {ratingText}
                  </span>
                </div>
              </div>

              {/* Aspect Ratings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 space-y-1.5">
                  <span className="font-bold text-gray-700 dark:text-gray-300 block">
                    Penjagaan Ibadah & Salat
                  </span>
                  <select
                    value={prayerAspect}
                    onChange={(e) => setPrayerAspect(Number(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-semibold text-gray-800 dark:text-gray-200 outline-none"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (Sangat Membantu)</option>
                    <option value={4}>⭐⭐⭐⭐ (Membantu)</option>
                    <option value={3}>⭐⭐⭐ (Cukup Membantu)</option>
                    <option value={2}>⭐⭐ (Kurang Membantu)</option>
                    <option value={1}>⭐ (Tidak Membantu)</option>
                  </select>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 space-y-1.5">
                  <span className="font-bold text-gray-700 dark:text-gray-300 block">
                    Jadwal & Tugas Kuliah
                  </span>
                  <select
                    value={scheduleAspect}
                    onChange={(e) => setScheduleAspect(Number(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-semibold text-gray-800 dark:text-gray-200 outline-none"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (Sangat Membantu)</option>
                    <option value={4}>⭐⭐⭐⭐ (Membantu)</option>
                    <option value={3}>⭐⭐⭐ (Cukup Membantu)</option>
                    <option value={2}>⭐⭐ (Kurang Membantu)</option>
                    <option value={1}>⭐ (Tidak Membantu)</option>
                  </select>
                </div>
              </div>

              {/* Comment Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Komentar & Masukan Pengalaman Anda
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ceritakan bagaimana website ini membantu ibadah dan jadwal kuliah Anda..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Ulasan Bintang</span>
                </button>
                <button
                  type="button"
                  onClick={handleDismissForever}
                  className="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-2xl text-xs font-semibold"
                >
                  Nanti Saja
                </button>
              </div>

            </form>
          </>
        )}

      </div>
    </div>
  );
};
