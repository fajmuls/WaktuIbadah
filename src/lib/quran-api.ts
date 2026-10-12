import { AyatItem, SurahItem } from '../types';
import { storage } from './storage';

// In-memory cache for ultra-fast instant opening
const memoryAyahCache = new Map<number, AyatItem[]>();

interface FetchResult {
  success: boolean;
  ayahs: AyatItem[];
  source?: string;
  error?: string;
}

/**
 * Fetch surah verses with multi-tiered resilient fallback:
 * 1. Offline storage cache
 * 2. Memory cache
 * 3. equran.id API
 * 4. api.quran.gading.dev API
 * 5. jsdelivr QuranJSON static CDN
 */
export async function getSurahAyahs(surahNumber: number): Promise<FetchResult> {
  // 1. Check offline persistent storage
  const offline = storage.getOfflineSurahData(surahNumber);
  if (offline && offline.ayahs && offline.ayahs.length > 0) {
    memoryAyahCache.set(surahNumber, offline.ayahs);
    return { success: true, ayahs: offline.ayahs, source: 'offline-cache' };
  }

  // 2. Check memory cache
  if (memoryAyahCache.has(surahNumber)) {
    const cached = memoryAyahCache.get(surahNumber)!;
    if (cached.length > 0) {
      return { success: true, ayahs: cached, source: 'memory-cache' };
    }
  }

  // 3. Try primary equran.id with 3.5s timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`https://equran.id/api/v2/surat/${surahNumber}`, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      if (json.data?.ayat && Array.isArray(json.data.ayat) && json.data.ayat.length > 0) {
        const ayahs: AyatItem[] = json.data.ayat.map((a: any) => ({
          nomorAyat: Number(a.nomorAyat || a.nomor || 1),
          teksArab: a.teksArab || a.ar || a.arab || '',
          teksLatin: a.teksLatin || a.tr || a.latin || '',
          teksIndonesia: a.teksIndonesia || a.idn || a.terjemahan || a.arti || '',
          audio: a.audio || {}
        }));
        memoryAyahCache.set(surahNumber, ayahs);
        return { success: true, ayahs, source: 'equran.id' };
      }
    }
  } catch (e) {
    console.warn(`[QuranAPI] equran.id failed for surah ${surahNumber}, trying secondary source...`, e);
  }

  // 4. Try secondary: api.quran.gading.dev
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`https://api.quran.gading.dev/surah/${surahNumber}`, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      if (json.data?.verses && Array.isArray(json.data.verses) && json.data.verses.length > 0) {
        const ayahs: AyatItem[] = json.data.verses.map((v: any) => ({
          nomorAyat: Number(v.number?.inSurah || v.number || 1),
          teksArab: v.text?.arab || '',
          teksLatin: v.text?.transliteration?.en || '',
          teksIndonesia: v.translation?.id || v.translation?.en || '',
          audio: v.audio?.primary ? { '05': v.audio.primary } : {}
        }));
        memoryAyahCache.set(surahNumber, ayahs);
        return { success: true, ayahs, source: 'gading.dev' };
      }
    }
  } catch (e) {
    console.warn(`[QuranAPI] gading.dev failed for surah ${surahNumber}, trying static CDN...`, e);
  }

  // 5. Try ultra-reliable global CDN: jsdelivr QuranJSON
  try {
    const res = await fetch(`https://cdn.jsdelivr.net/gh/penggguna/QuranJSON@master/surah/${surahNumber}.json`);
    if (res.ok) {
      const json = await res.json();
      if (json.verses && Array.isArray(json.verses) && json.verses.length > 0) {
        const ayahs: AyatItem[] = json.verses.map((v: any) => ({
          nomorAyat: Number(v.number || 1),
          teksArab: v.text || '',
          teksLatin: '',
          teksIndonesia: v.translation_id || v.translation_en || '',
          audio: {}
        }));
        memoryAyahCache.set(surahNumber, ayahs);
        return { success: true, ayahs, source: 'jsdelivr-cdn' };
      }
    }
  } catch (e) {
    console.error(`[QuranAPI] All online sources failed for surah ${surahNumber}:`, e);
  }

  return {
    success: false,
    ayahs: [],
    error: 'Gagal memuat ayat Al-Qur\'an. Periksa koneksi internet Anda atau coba muat ulang.'
  };
}
