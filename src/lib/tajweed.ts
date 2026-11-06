/**
 * Tajweed Parser and Colorizer for Al-Qur'an (Standar Kemenag RI)
 * 
 * Aturan warna Tajwid standar Kementerian Agama RI:
 * - Ghunnah / Tasydid (نّ, مّ): Hijau Emerald (#10B981)
 * - Ikhfa' (Nun sukun / Tanwin bertemu huruf ikhfa'): Kuning / Amber (#F59E0B)
 * - Idgham (Bighunnah / Bilaghunnah): Cyan / Biru Laut (#06B6D4)
 * - Iqlab (Nun sukun / Tanwin bertemu Ba / mim kecil): Ungu (#8B5CF6)
 * - Qalqalah (ق, ط, ب, ج, د sukun): Merah / Rose (#EF4444)
 * - Mad Wajib / Jaiz / Lazim (Tanda bendera mad ~ / tanda panjang): Merah Tua / Crimson (#DC2626)
 */

export interface TajweedRule {
  type: 'ghunnah' | 'ikhfa' | 'idgham' | 'iqlab' | 'qalqalah' | 'mad' | 'normal';
  color: string;
  name: string;
}

export const TAJWEED_LEGEND = [
  { type: 'ghunnah', name: 'Ghunnah', color: '#10B981', desc: 'Dengung (Nun/Mim Tasydid)' },
  { type: 'ikhfa', name: 'Ikhfa', color: '#F59E0B', desc: 'Samar-samar' },
  { type: 'idgham', name: 'Idgham', color: '#06B6D4', desc: 'Meleburkan huruf' },
  { type: 'iqlab', name: 'Iqlab', color: '#8B5CF6', desc: 'Menukar bunyi menjadi Mim' },
  { type: 'qalqalah', name: 'Qalqalah', color: '#EF4444', desc: 'Memantul (Baju Di Toko)' },
  { type: 'mad', name: 'Mad Wajib / Jaiz', color: '#DC2626', desc: 'Panjang 4-6 Harakat' },
];

/**
 * Returns HTML string with tajweed spans injected around matching Arabic tokens.
 */
export function renderTajweedHtml(text: string): string {
  if (!text) return '';

  let html = text;

  // 1. Mad tanda bendera (Alif/Waw/Ya bertanda mad ~ / maddah)
  // Unicode maddah: \u0653 (Maddah), \u06E4, \u0670 (Superscript Alef)
  html = html.replace(/([\u0621-\u064A][\u064B-\u065F\u0670\u06D6-\u06ED]*[\u0653\u06E4][\u064B-\u065F\u0670\u06D6-\u06ED]*)/g, 
    '<span class="tajweed-mad" style="color:#DC2626;font-weight:600;" title="Mad">$1</span>');

  // 2. Qalqalah: Huruf ق ط ب ج د yang bersukun (\u0652) atau bertanda sukun jazm
  html = html.replace(/([قطبجد][\u0652\u06DF])/g, 
    '<span class="tajweed-qalqalah" style="color:#EF4444;font-weight:600;" title="Qalqalah">$1</span>');

  // 3. Ghunnah: Nun atau Mim yang bertasydid (ّ / \u0651)
  html = html.replace(/([نم][\u0651][\u064B-\u0650\u0652]?)/g, 
    '<span class="tajweed-ghunnah" style="color:#10B981;font-weight:600;" title="Ghunnah">$1</span>');

  // 4. Iqlab: Nun sukun atau Tanwin dengan tanda mim kecil (ۢ / ۭ / \u06E2 / \u06ED) atau bertemu Ba
  html = html.replace(/([ن][\u0652]?[\u06E2\u06ED]|[\u064B\u064C\u064D][\u06E2\u06ED])/g, 
    '<span class="tajweed-iqlab" style="color:#8B5CF6;font-weight:600;" title="Iqlab">$1</span>');

  // 5. Ikhfa': Nun sukun atau Tanwin sebelum huruf ikhfa (ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك)
  const ikhfaLetters = 'تثجدذزسشصضطظفقك';
  const ikhfaRegex = new RegExp(`([ن][\\u0652]?|[\\u064B\\u064C\\u064D])(\\s*)([${ikhfaLetters}])`, 'g');
  html = html.replace(ikhfaRegex, 
    '<span class="tajweed-ikhfa" style="color:#F59E0B;font-weight:600;" title="Ikhfa">$1</span>$2$3');

  // 6. Idgham: Nun sukun atau Tanwin sebelum huruf idgham (ي ر م ل و ن)
  const idghamLetters = 'يرملون';
  const idghamRegex = new RegExp(`([ن][\\u0652]?|[\\u064B\\u064C\\u064D])(\\s*)([${idghamLetters}][\\u0651]?)`, 'g');
  html = html.replace(idghamRegex, 
    '<span class="tajweed-idgham" style="color:#06B6D4;font-weight:600;" title="Idgham">$1</span>$2$3');

  return html;
}
