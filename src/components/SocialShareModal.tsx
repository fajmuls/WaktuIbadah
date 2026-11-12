import React, { useState, useRef } from 'react';
import { X, Copy, Download, Share2, Check, Sparkles, Image as ImageIcon } from 'lucide-react';
import { playButtonTapSound, vibrateSuccess } from '../lib/audio';

export interface SocialShareData {
  title: string;       // e.g. "HR. Bukhari No. 1" or "QS. Al-Baqarah: 183"
  arab: string;        // Teks Arab
  indo: string;        // Terjemahan Indonesia
  source: string;      // Rujukan sumber (e.g. HR. Bukhari, Muslim No. 1907)
  topic?: string;      // Topik (e.g. "Niat & Keikhlasan")
  type: 'hadis' | 'quran';
}

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SocialShareData | null;
}

type CardTheme = 'emerald' | 'desert' | 'slate' | 'teal';

export const SocialShareModal: React.FC<SocialShareModalProps> = ({ isOpen, onClose, data }) => {
  const [selectedTheme, setSelectedTheme] = useState<CardTheme>('emerald');
  const [copied, setCopied] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;

  const themes: Record<CardTheme, { name: string; bg: string; border: string; titleBg: string; titleText: string; arabText: string; bodyText: string; footerText: string; accentBadge: string }> = {
    emerald: {
      name: 'Hijau Zamrud',
      bg: 'bg-gradient-to-br from-[#064E3B] via-[#047857] to-[#065F46]',
      border: 'border-[#FDE047]',
      titleBg: 'bg-[#FDE047]',
      titleText: 'text-[#064E3B]',
      arabText: 'text-[#FFFBEB]',
      bodyText: 'text-[#ECFDF5]',
      footerText: 'text-[#FDE047]',
      accentBadge: 'bg-[#022C22] text-[#FDE047] border-[#FDE047]',
    },
    desert: {
      name: 'Krem Perkamen',
      bg: 'bg-gradient-to-br from-[#FFF8E8] via-[#FBF0D9] to-[#F3E2B8]',
      border: 'border-[#7A4B22]',
      titleBg: 'bg-[#7A4B22]',
      titleText: 'text-[#FFF3DC]',
      arabText: 'text-[#2E1A08]',
      bodyText: 'text-[#4E2E12]',
      footerText: 'text-[#7A4B22]',
      accentBadge: 'bg-[#E6C27A] text-[#3A210C] border-[#7A4B22]',
    },
    slate: {
      name: 'Midnight Slate',
      bg: 'bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155]',
      border: 'border-[#38BDF8]',
      titleBg: 'bg-[#38BDF8]',
      titleText: 'text-[#0F172A]',
      arabText: 'text-[#F8FAFC]',
      bodyText: 'text-[#E2E8F0]',
      footerText: 'text-[#38BDF8]',
      accentBadge: 'bg-[#0284C7] text-white border-[#38BDF8]',
    },
    teal: {
      name: 'Sunset Retro',
      bg: 'bg-gradient-to-br from-[#0F766E] via-[#0D9488] to-[#14B8A6]',
      border: 'border-[#F472B6]',
      titleBg: 'bg-[#F472B6]',
      titleText: 'text-[#881337]',
      arabText: 'text-[#FFF1F2]',
      bodyText: 'text-[#FCE7F3]',
      footerText: 'text-[#FDE047]',
      accentBadge: 'bg-[#881337] text-[#FDE047] border-[#F472B6]',
    },
  };

  const themeConfig = themes[selectedTheme];

  const handleCopyText = async () => {
    const formattedText = `✨ *${data.title}* ${data.topic ? `[${data.topic}]` : ''}\n\n${data.arab}\n\n"${data.indo}"\n\n📚 Sumber: ${data.source}\n📱 Bagikan via WaktuIbadah App`;
    try {
      await navigator.clipboard.writeText(formattedText);
      setCopied(true);
      vibrateSuccess();
      playButtonTapSound();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleNativeShare = async () => {
    const formattedText = `✨ *${data.title}*\n\n${data.arab}\n\n"${data.indo}"\n\n📚 Sumber: ${data.source}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: data.title,
          text: formattedText,
          url: window.location.href
        });
        vibrateSuccess();
      } catch (err) {
        console.error('Share error', err);
      }
    } else {
      handleCopyText();
    }
  };

  const handleDownloadImage = () => {
    setIsGeneratingImage(true);
    playButtonTapSound();

    try {
      // Create HTML5 Canvas dynamically for pristine resolution render
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // Draw background gradient based on theme
      const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
      if (selectedTheme === 'emerald') {
        grad.addColorStop(0, '#064E3B');
        grad.addColorStop(0.5, '#047857');
        grad.addColorStop(1, '#065F46');
      } else if (selectedTheme === 'desert') {
        grad.addColorStop(0, '#FFF8E8');
        grad.addColorStop(0.5, '#FBF0D9');
        grad.addColorStop(1, '#F3E2B8');
      } else if (selectedTheme === 'slate') {
        grad.addColorStop(0, '#0F172A');
        grad.addColorStop(0.5, '#1E293B');
        grad.addColorStop(1, '#334155');
      } else {
        grad.addColorStop(0, '#0F766E');
        grad.addColorStop(0.5, '#0D9488');
        grad.addColorStop(1, '#14B8A6');
      }

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1080);

      // Draw outer Memphis border frame
      ctx.lineWidth = 12;
      ctx.strokeStyle = selectedTheme === 'desert' ? '#7A4B22' : selectedTheme === 'slate' ? '#38BDF8' : '#FDE047';
      ctx.strokeRect(36, 36, 1008, 1008);

      // Draw Header Badge
      ctx.fillStyle = selectedTheme === 'desert' ? '#7A4B22' : selectedTheme === 'slate' ? '#38BDF8' : '#FDE047';
      ctx.beginPath();
      ctx.roundRect(72, 72, 540, 64, 16);
      ctx.fill();

      ctx.fillStyle = selectedTheme === 'desert' ? '#FFF3DC' : selectedTheme === 'slate' ? '#0F172A' : '#064E3B';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(data.title.toUpperCase(), 96, 116);

      // Topic badge if present
      if (data.topic) {
        ctx.fillStyle = selectedTheme === 'desert' ? '#E6C27A' : '#022C22';
        ctx.beginPath();
        ctx.roundRect(640, 72, 368, 64, 16);
        ctx.fill();

        ctx.fillStyle = selectedTheme === 'desert' ? '#3A210C' : '#FDE047';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(data.topic, 824, 114);
      }

      // Draw Arabic text
      ctx.fillStyle = selectedTheme === 'desert' ? '#2E1A08' : selectedTheme === 'slate' ? '#F8FAFC' : '#FFFBEB';
      ctx.font = 'bold 44px "Traditional Arabic", "Amiri", "Scheherazade New", serif';
      ctx.textAlign = 'right';

      // Simple multi-line wrap helper for Arabic
      const wrapArabicText = (text: string, x: number, startY: number, maxWidth: number, lineHeight: number) => {
        const words = text.split(' ');
        let line = '';
        let y = startY;

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, x, y);
        return y;
      };

      const arabEndY = wrapArabicText(data.arab, 1008, 240, 936, 75);

      // Separator Line
      ctx.strokeStyle = selectedTheme === 'desert' ? '#C99A4B' : '#6EE7B7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(72, arabEndY + 40);
      ctx.lineTo(1008, arabEndY + 40);
      ctx.stroke();

      // Indonesian translation text
      ctx.fillStyle = selectedTheme === 'desert' ? '#4E2E12' : selectedTheme === 'slate' ? '#E2E8F0' : '#ECFDF5';
      ctx.font = 'normal 28px sans-serif';
      ctx.textAlign = 'left';

      const wrapText = (text: string, x: number, startY: number, maxWidth: number, lineHeight: number) => {
        const words = text.split(' ');
        let line = '';
        let y = startY;

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, x, y);
        return y;
      };

      wrapText(`"${data.indo}"`, 72, arabEndY + 90, 936, 42);

      // Draw Footer
      ctx.fillStyle = selectedTheme === 'desert' ? '#7A4B22' : selectedTheme === 'slate' ? '#38BDF8' : '#FDE047';
      ctx.font = 'extrabold 26px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`📚 ${data.source}`, 72, 980);

      ctx.textAlign = 'right';
      ctx.fillText('WaktuIbadah • Islamic Planner', 1008, 980);

      // Trigger PNG Download
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${data.type}-${data.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`;
      a.click();
      vibrateSuccess();
    } catch (err) {
      console.error('Canvas export error:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FFF8E8] dark:bg-slate-900 border-[2.5px] border-[#121212] rounded-2xl shadow-[6px_6px_0px_#121212] max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-[#0B4A3B] text-white flex items-center justify-between border-b-2 border-black">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#E6C27A]" />
            <h3 className="font-extrabold text-sm sm:text-base">Bagikan Poster & Teks</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          
          {/* Theme Selector */}
          <div>
            <label className="block text-xs font-bold text-[#121212] dark:text-gray-200 mb-2">
              Pilih Tema Warna Poster:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(themes) as CardTheme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setSelectedTheme(t);
                    playButtonTapSound();
                  }}
                  className={`py-2 px-1 text-[11px] font-bold rounded-xl border-2 border-black transition-all text-center truncate ${
                    selectedTheme === t 
                      ? 'bg-[#121212] text-[#6EE7B7] shadow-[2px_2px_0px_#6EE7B7]' 
                      : 'bg-white text-black hover:bg-gray-100'
                  }`}
                >
                  {themes[t].name}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Card Canvas Preview */}
          <div 
            ref={cardRef}
            className={`p-5 rounded-2xl border-[2.5px] ${themeConfig.border} ${themeConfig.bg} shadow-[4px_4px_0px_#121212] space-y-4 transition-all duration-300`}
          >
            {/* Card Header Badges */}
            <div className="flex justify-between items-center gap-2 flex-wrap">
              <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-xl border-1.5 border-black shadow-[1.5px_1.5px_0px_#121212] ${themeConfig.titleBg} ${themeConfig.titleText}`}>
                {data.title}
              </span>
              {data.topic && (
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-xl border ${themeConfig.accentBadge}`}>
                  {data.topic}
                </span>
              )}
            </div>

            {/* Arabic Text */}
            <p className={`wi-arab text-right text-2xl sm:text-3xl leading-[2.2] font-semibold select-text ${themeConfig.arabText}`} dir="rtl" lang="ar">
              {data.arab}
            </p>

            <hr className="border-dashed border-white/30" />

            {/* Translation */}
            <p className={`text-xs sm:text-sm font-medium leading-relaxed italic ${themeConfig.bodyText}`}>
              "{data.indo}"
            </p>

            {/* Footer Reference */}
            <div className="flex items-center justify-between pt-2 text-[11px] font-extrabold border-t border-white/20">
              <span className={themeConfig.footerText}>📚 {data.source}</span>
              <span className="opacity-75 text-[10px]">WaktuIbadah App</span>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-3.5 bg-white dark:bg-slate-900 border-t-2 border-black flex items-center justify-between gap-2">
          <button
            onClick={handleCopyText}
            className="flex-1 memphis-btn bg-emerald-600 text-white hover:bg-emerald-700 py-2.5 text-xs gap-1.5"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
          </button>

          <button
            onClick={handleDownloadImage}
            disabled={isGeneratingImage}
            className="flex-1 memphis-btn memphis-btn-yellow py-2.5 text-xs gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>{isGeneratingImage ? 'Memproses...' : 'Unduh Gambar'}</span>
          </button>

          <button
            onClick={handleNativeShare}
            className="p-2.5 border-[1.5px] border-black bg-slate-900 text-[#6EE7B7] rounded-xl font-bold hover:bg-slate-800 shrink-0"
            title="Bagikan Ke Aplikasi Lain"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
