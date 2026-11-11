import React, { useState } from 'react';
import { Play } from 'lucide-react';

interface Props {
  videoId: string;
  title?: string;
}

/**
 * Pemutar YouTube ringan: hanya memuat thumbnail dulu, iframe baru dimuat saat diklik
 * (hemat kuota & tidak memperlambat halaman). Memakai youtube-nocookie.com.
 */
export default function YouTubeEmbed({ videoId, title = 'Video WaktuIbadah' }: Props) {
  const [active, setActive] = useState(false);
  if (!/^[\w-]{11}$/.test(videoId)) return null;

  return (
    <div className="border-[1.5px] border-[#121212] dark:border-slate-700 rounded-2xl overflow-hidden shadow-[2px_2px_0px_#121212] bg-black">
      <div className="relative w-full aspect-video">
        {active ? (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setActive(true)}
            aria-label={`Putar video: ${title}`}
            className="absolute inset-0 w-full h-full group"
          >
            <img
              src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover"
            />
            <span className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-14 h-14 rounded-full bg-emerald-500 border-[1.5px] border-[#121212] flex items-center justify-center shadow-[2px_2px_0px_#121212]">
                <Play className="w-6 h-6 text-[#121212] fill-[#121212] ml-0.5" />
              </span>
            </span>
          </button>
        )}
      </div>
      <div className="px-3 py-2 bg-white dark:bg-slate-900 text-[11px] font-semibold text-gray-800 dark:text-gray-200">
        ▶ {title}
      </div>
    </div>
  );
}
