import React, { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { AdminReviewConfig } from '../types';
import { ExternalLink, Sparkles, MessageSquareHeart, X } from 'lucide-react';

export function AdminReviewBanner() {
  const [config, setConfig] = useState<AdminReviewConfig>(() => storage.getAdminReviewConfig());
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(() => {
    const user = storage.getUser();
    return storage.hasUserReviewed(user?.name);
  });

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setConfig(e.detail);
      } else {
        setConfig(storage.getAdminReviewConfig());
      }
    };

    const handleReviewAdded = () => {
      setHasReviewed(true);
    };

    window.addEventListener('wi_admin_review_updated', handleUpdate);
    window.addEventListener('wi_website_review_added', handleReviewAdded);
    return () => {
      window.removeEventListener('wi_admin_review_updated', handleUpdate);
      window.removeEventListener('wi_website_review_added', handleReviewAdded);
    };
  }, []);

  // Hide banner permanently if user has already submitted review, or disabled, or dismissed
  if (!config.isEnabled || !config.gformUrl || isDismissed || hasReviewed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 text-white rounded-xl px-3 h-12 border-[1.5px] border-black shadow-[2px_2px_0px_#121212] flex items-center justify-between gap-2 text-xs">
      <div className="flex items-center gap-2 min-w-0">
        <MessageSquareHeart className="w-4 h-4 text-amber-300 shrink-0" />
        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-teal-950 px-1.5 py-0.5 rounded shrink-0">
          Evaluasi PAI
        </span>
        <h4 className="text-xs font-semibold truncate text-emerald-50 min-w-0">
          {config.title || 'Kuesioner Evaluasi Website'}
        </h4>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {(config.reviewMode === 'website' || config.reviewMode === 'both') && (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('wi_check_five_prayers_review'))}
            className="px-2.5 py-1 bg-white text-emerald-950 border border-black rounded-lg text-[11px] font-bold shadow-[1px_1px_0px_#121212] active:translate-y-0.5 whitespace-nowrap"
          >
            Rating
          </button>
        )}
        {(config.reviewMode === 'gform' || config.reviewMode === 'both') && config.gformUrl && (
          <a
            href={config.gformUrl}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 bg-amber-400 text-teal-950 border border-black rounded-lg text-[11px] font-bold shadow-[1px_1px_0px_#121212] active:translate-y-0.5 flex items-center gap-1 whitespace-nowrap"
          >
            <span>Form</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 text-teal-200 hover:text-white rounded-lg"
          aria-label="Tutup banner evaluasi"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
