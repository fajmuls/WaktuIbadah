/**
 * Tajweed Parser and Colorizer for Al-Qur'an (Standar Kemenag RI)
 * 
 * Mode Tajwid:
 * - 'none': Tanpa pewarnaan (Default). Tulisan teks Arab murni tanpa pemotongan span.
 * - 'basic': Tajwid Dasar (Ghunnah, Ikhfa, Idgham, Iqlab, Qalqalah, Mad).
 * - 'complex': Tajwid Lengkap / Detail (Memisahkan Idgham Bighunnah vs Bilaghunnah, Izhar, dsb).
 */

export type TajweedMode = 'none' | 'basic' | 'complex';

export interface TajweedRule {
  type: string;
  color: string;
  name: string;
  desc: string;
}

export const TAJWEED_BASIC_LEGEND: TajweedRule[] = [
  { type: 'ghunnah', name: 'Ghunnah', color: '#10B981', desc: 'Dengung (Nun / Mim Tasydid)' },
  { type: 'ikhfa', name: 'Ikhfa', color: '#F59E0B', desc: 'Samar-samar (Nun Sukun/Tanwin)' },
  { type: 'idgham', name: 'Idgham', color: '#06B6D4', desc: 'Meleburkan huruf' },
  { type: 'iqlab', name: 'Iqlab', color: '#8B5CF6', desc: 'Menukar bunyi menjadi Mim' },
  { type: 'qalqalah', name: 'Qalqalah', color: '#EF4444', desc: 'Memantul (ق, ط, ب, ج, د)' },
  { type: 'mad', name: 'Mad Wajib / Jaiz', color: '#DC2626', desc: 'Panjang 4-6 Harakat (Tanda Bendera ~)' },
];

export const TAJWEED_COMPLEX_LEGEND: TajweedRule[] = [
  { type: 'ghunnah', name: 'Ghunnah', color: '#10B981', desc: 'Dengung Tasydid (نّ, مّ)' },
  { type: 'idgham_bighunnah', name: 'Idgham Bighunnah', color: '#06B6D4', desc: 'Melebur dengan dengung (ي, ن, م, و)' },
  { type: 'idgham_bilaghunnah', name: 'Idgham Bilaghunnah', color: '#3B82F6', desc: 'Melebur tanpa dengung (ل, ر)' },
  { type: 'iqlab', name: 'Iqlab', color: '#8B5CF6', desc: 'Membalikkan ke huruf Mim (ۢ)' },
  { type: 'ikhfa', name: 'Ikhfa Haqiqi', color: '#F59E0B', desc: 'Samar-samar 15 huruf ikhfa' },
  { type: 'qalqalah', name: 'Qalqalah', color: '#EF4444', desc: 'Pantulan huruf sukun (قطبجد)' },
  { type: 'mad', name: 'Mad Far\'i', color: '#DC2626', desc: 'Panjang bacaan bertanda bendera (~)' },
];

/**
 * Returns HTML string with tajweed spans injected around matching Arabic tokens.
 * Default is 'none' (returns pure raw Arabic text with zero span tags).
 */
export function renderTajweedHtml(text: string, mode: TajweedMode = 'none'): string {
  if (!text) return '';
  if (mode === 'none') {
    return text;
  }

  let html = text;

  // 1. Mad tanda bendera (Alif/Waw/Ya bertanda mad ~ / maddah)
  // Unicode maddah: \u0653 (Maddah), \u06E4, \u0670 (Superscript Alef)
  html = html.replace(/([\u0621-\u064A][\u064B-\u065F\u0670\u06D6-\u06ED]*[\u0653\u06E4][\u064B-\u065F\u0670\u06D6-\u06ED]*)/g, 
    '<span class="tajweed-mad" style="color:#DC2626;font-weight:600;display:inline;" title="Mad">$1</span>');

  // 2. Qalqalah: Huruf ق ط ب ج د yang bersukun (\u0652) atau bertanda sukun jazm
  html = html.replace(/([قطبجد][\u0652\u06DF])/g, 
    '<span class="tajweed-qalqalah" style="color:#EF4444;font-weight:600;display:inline;" title="Qalqalah">$1</span>');

  // 3. Ghunnah: Nun atau Mim yang bertasydid (ّ / \u0651)
  html = html.replace(/([نم][\u0651][\u064B-\u0650\u0652]?)/g, 
    '<span class="tajweed-ghunnah" style="color:#10B981;font-weight:600;display:inline;" title="Ghunnah">$1</span>');

  // 4. Iqlab: Nun sukun atau Tanwin dengan tanda mim kecil (ۢ / ۭ / \u06E2 / \u06ED) atau bertemu Ba
  html = html.replace(/([ن][\u0652]?[\u06E2\u06ED]|[\u064B\u064C\u064D][\u06E2\u06ED])/g, 
    '<span class="tajweed-iqlab" style="color:#8B5CF6;font-weight:600;display:inline;" title="Iqlab">$1</span>');

  if (mode === 'complex') {
    // 5A. Idgham Bighunnah: Nun sukun / Tanwin bertemu (ي ن م و)
    const bighunnahLetters = 'ينمو';
    const bighunnahRegex = new RegExp(`([ن][\\u0652]?|[\\u064B\\u064C\\u064D])(\\s*)([${bighunnahLetters}][\\u0651]?)`, 'g');
    html = html.replace(bighunnahRegex, 
      '<span class="tajweed-idgham-bi" style="color:#06B6D4;font-weight:600;display:inline;" title="Idgham Bighunnah">$1</span>$2$3');

    // 5B. Idgham Bilaghunnah: Nun sukun / Tanwin bertemu (ل ر)
    const bilaghunnahLetters = 'لر';
    const bilaghunnahRegex = new RegExp(`([ن][\\u0652]?|[\\u064B\\u064C\\u064D])(\\s*)([${bilaghunnahLetters}][\\u0651]?)`, 'g');
    html = html.replace(bilaghunnahRegex, 
      '<span class="tajweed-idgham-bila" style="color:#3B82F6;font-weight:600;display:inline;" title="Idgham Bilaghunnah">$1</span>$2$3');
  } else {
    // Basic Idgham (semua huruf Idgham يرملون)
    const idghamLetters = 'يرملون';
    const idghamRegex = new RegExp(`([ن][\\u0652]?|[\\u064B\\u064C\\u064D])(\\s*)([${idghamLetters}][\\u0651]?)`, 'g');
    html = html.replace(idghamRegex, 
      '<span class="tajweed-idgham" style="color:#06B6D4;font-weight:600;display:inline;" title="Idgham">$1</span>$2$3');
  }

  // 6. Ikhfa': Nun sukun atau Tanwin sebelum huruf ikhfa (ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك)
  const ikhfaLetters = 'تثجدذزسشصضطظفقك';
  const ikhfaRegex = new RegExp(`([ن][\\u0652]?|[\\u064B\\u064C\\u064D])(\\s*)([${ikhfaLetters}])`, 'g');
  html = html.replace(ikhfaRegex, 
    '<span class="tajweed-ikhfa" style="color:#F59E0B;font-weight:600;display:inline;" title="Ikhfa">$1</span>$2$3');

  return html;
}
