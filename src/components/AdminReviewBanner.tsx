import React, { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { AdminReviewConfig } from '../types';
import { ExternalLink, Sparkles, MessageSquareHeart, X } from 'lucide-react';

export function AdminReviewBanner() {
  const [config, setConfig] = useState<AdminReviewConfig>(() => storage.getAdminReviewConfig());
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setConfig(e.detail);
      } else {
        setConfig(storage.getAdminReviewConfig());
      }
    };

    window.addEventListener('wi_admin_review_updated', handleUpdate);
    return () => window.removeEventListener('wi_admin_review_updated', handleUpdate);
  }, []);

  if (!config.isEnabled || !config.gformUrl || isDismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 text-white rounded-2xl p-3.5 shadow-md border border-teal-500/30 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 relative overflow-hidden">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 backdrop-blur-xs">
          <MessageSquareHeart className="w-5 h-5 text-teal-100" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-extrabold uppercase tracking-widest bg-amber-400 text-teal-950 px-1.5 py-0.5 rounded">
              Evaluasi Proyek PAI
            </span>
          </div>
          <h4 className="text-xs sm:text-sm font-bold truncate mt-0.5">
            {config.title || 'Kuesioner Evaluasi Penggunaan Website'}
          </h4>
          <p className="text-[11px] text-teal-100 line-clamp-1 opacity-90 hidden sm:block">
            {config.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {(config.reviewMode === 'website' || config.reviewMode === 'both') && (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('wi_check_five_prayers_review'))}
            className="px-3 py-1.5 bg-white text-emerald-900 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm active:scale-95"
          >
            <span>⭐ Rating Bintang</span>
          </button>
        )}
        {(config.reviewMode === 'gform' || config.reviewMode === 'both') && config.gformUrl && (
          <a
            href={config.gformUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-teal-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm active:scale-95"
          >
            <span>Google Form</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 text-teal-200 hover:text-white rounded-lg transition-colors"
          title="Tutup banner sementara"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
