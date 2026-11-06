# Optimization & Mobile-First Refinement Plan for WaktuIbadah (v2.3.1)

Refine and optimize the UI/UX across mobile viewports (360px, 390px, 412px) while preserving the green Memphis identity with a lighter, touch-friendly design. All existing business logic, data models, routes, audio playback, PWA notifications, and Settings state remain 100% untouched. Non-Quran Arabic text (Doa, Hadis, etc.) is strictly preserved.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions incorporate confirmed user preferences from Phase 1:

- **Confirmed Decision 1 (Quran Reading Controls)**: Font size controls (A-/A+) and Latin/Translation display toggles will be rendered as compact 360px-friendly icon triggers in the sticky single-row header, backed by an optional bottom sheet drawer for full reading settings.
- **Confirmed Decision 2 (Admin Dashboard Access)**: The Admin Dashboard entrance button will be discreetly located at the very bottom of the Settings page instead of displaying globally in the top bar or home screen.

---

## 1. Overview & Core Concept

- **What It Does**: Transforms the WaktuIbadah mobile interface into a lightweight, zero-horizontal-overflow, touch-ergonomic experience optimized for 360px, 390px, and 412px mobile screens.
- **Target Audience**: Students and Muslim practitioners accessing prayer times, academic schedules, Quran tilawah, and daily prayers on smartphones.
- **Key Value**: Crisp legibility, zero clipped text/badges, maximum vertical screen real estate for Quran reading, and comfortable touch targets without heavy visual clutter.

---

## 2. User Experience & Visual Design System

```
[ 360px - 412px MOBILE VIEWPORT LAYOUT ]

+-------------------------------------+  ^ Sticky Top Header (Max 56-64px)
| [<] Al-Fatihah   (A-/A+) [⚙] [🔊] |  | Single row, 36px icon controls
|     7 ayat • Mekah                  |  v
+-------------------------------------+
| [Card: p-3, 1.5px border, 2px shadow]
|  (1)                        📌 ⭐ 🔊 |  <- 32px Icon-Only Actions (No Text Labels)
|  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ          |  <- 26-28px Arabic, ~2.1 line-height
|  Bismillāhir-raḥmānir-raḥīm.        |  <- 13px Italic Latin (No heavy box)
|  Dengan nama Allah Yang Maha...     |  <- 14px Translation (1.6 line-height)
+-------------------------------------+
| [ AUDIO MINI PLAYER (Max 56px) ]    |  <- Above Bottom Nav
+-------------------------------------+
| [Tab 1] [Tab 2] [Tab 3] [Tab 4] [Tab 5]| <- 60px Fixed Bottom Nav
+-------------------------------------+
```

### A. Global Design Refinements
- **Border & Shadow Calibration**:
  - Borders: Reduced from ~3px to crisp 1.5px (`border-[1.5px] border-black dark:border-slate-700`).
  - Drop Shadows: Softened from 4-6px to 2px offset (`shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`).
- **Typography & Scale**:
  - Page Titles: 18-20px `font-bold` (sentence case, max 1-2 lines).
  - Sub-titles & Kicker Labels: 12px `text-xs`.
  - Body Text: 13-14px (`text-xs` to `text-sm`).
  - Prohibit `font-black` + uppercase for multi-word prose.
- **Card Spacing & Padding**:
  - Card Padding: Reduced from `p-5` to `p-3` or `p-4`.
  - Inter-card Gaps: 10-12px (`space-y-3` / `gap-3`).
- **Control Sizing & Touch Ergonomics**:
  - Primary Buttons: 40px height (`h-10`).
  - Icon Buttons: 36px (`h-9 w-9 flex items-center justify-center`).
  - Pill Controls: `px-3 py-1 text-xs`.
  - Hitbox Assurance: Maintain $\ge 40\text{px}$ touch targets using invisible padding/flex wrappers.
- **Clipping Prevention**:
  - Date pills ("06/11/2026" on Ibadah), tabs ("Tersimpan" on Quran, "Doa Be..." on Doa), and "Ubah PIN" (Settings) equipped with `flex-wrap`, `min-w-0`, `truncate`, or touch horizontal carousels with fade indicators.
- **Navigation Safety Margin**:
  - All page scroll containers will feature `pb-24` padding bottom to ensure content is never obscured by the 60px bottom nav.

### B. Bottom Navigation
- **Height**: Fixed 60px (`h-15 flex items-center`).
- **Item Anatomy**: Replace large protruding active boxes with a subtle colored icon pill badge + 10-11px caption label (`text-[10.5px] font-medium`). Equal width distribution across all 5 items (`grid grid-cols-5 w-full`).

### C. Home Page Refinements
- **PAI Evaluation Banner**: Single-line compact banner (~48px height) with 12px text, small "Rating" button, and close icon (`X`).
- **Salam Header**: Single-line "Assalamu'alaikum, Fajmuls" (18px) + single-line combined Gregorian + Hijri date (11-12px).
- **Admin Entrance**: Removed from top global bar; relocated discreetly to the bottom of the Settings page.
- **Prayer Time Card**:
  - Next prayer name: 28-32px (`text-2xl` to `text-3xl`).
  - Time text: 16px (`text-base`).
  - 5 prayer icons: Single horizontal row with scrollable/flex fit without clipping.
  - "Tes Suara Azan": Compact 36px icon or small pill button.

### D. Schedule (Jadwal) Page
- **Header Actions**: Deduplicate "Tambah Jadwal" button (keep only 1 in top header or 48px FAB).
- **Empty State**: Compact 40px icon + single sentence text; zero excessive whitespace.
- **Date Chips**: Standardized to 52x60px interactive date selector chips.

### E. Worship (Ibadah) Page
- **Header**: Single-line title; date selector pill unclipped.
- **Prayer Rows**: Height ~56px; 24px custom checkbox; removed redundant "Klik centang" label; 12px prayer time display.
- **Cards**: Compact progress summary card; Sunnah prayer card with small rakaat badge (`px-2 py-0.5 text-[10px]`) and non-truncated titles.

### F. Settings (Pengaturan) Page
- **PIN Badge & Button**: Flex-col or flex-wrap layout preventing collision between "Terproteksi PIN" badge and "Ubah PIN" button.
- **Cloud Sync**: Dense card layout with 40px height Upload/Download buttons.
- **Admin Access**: Discrete "Dashboard Admin" entry button placed at the bottom footer of Settings.

### G. Al-Qur'an Reading Page (High Priority)
- **Sticky Top Header**: Single-row max 64px height (`sticky top-0 z-30 h-16`):
  - Left: Back/close button.
  - Center: Surah title 16px bold + "7 ayat • Mekah" 11px truncated + small Arabic surah title.
  - Right: 36px icon controls for A-/A+ font size, Latin/Translation visibility, and murottal audio trigger.
- **Ayah Cards**:
  - Padding: `p-3` (12px padding).
  - Header Row: 28px number badge on left; 3 icon-only 32px buttons on right (📌 Last Read Marker, ⭐ Favorite Bookmark, 🔊 Ayah Audio) with active color fill & aria-labels. Text labels hidden on mobile (<640px).
  - Arabic Text: 26-28px (`text-[26px]` to `text-[28px]`), line-height ~2.1, right-aligned. End-of-ayah marker (20px) inline without thick borders.
  - Transliteration (Latin): 13px italic with subtle dark green tint/indicator line (no heavy boxed frame).
  - Translation: 14px high-contrast text with 1.6 line-height.
  - Font Size Persistence: `localStorage.getItem('wi_quran_font_size')` (defaults to 26px, range 22px-34px).
  - Mini-Player: Fixed bottom audio bar (max height 56px, positioned above bottom nav).
  - Last-Read Restore: Automatic smooth scroll restoration to saved `lastReadAyah`.

### H. Surah List Page
- **Search**: Compact search bar placeholder ("Cari surat atau nomor...").
- **Last Read Banner**: Compact card with quick resume button.
- **Popular Surahs**: Wrapped small chips for quick navigation.

---

## 3. Product Decisions & Technical Strategy

| Decision | Chosen Approach | Rationale |
| :--- | :--- | :--- |
| **Border & Shadow Math** | 1.5px solid border + 2px offset shadow | Retains signature Memphis identity while preventing heavy card overhangs on 360px viewports. |
| **Ayah Action Bar** | 32px Icon-only buttons on mobile (<640px) | Eliminates horizontal line wrapping of "TANDAI BACA / SIMPAN FAVORIT", allowing full focus on the Quranic text. |
| **Quran Header Height** | 64px Single-Row Sticky Header | Replaces the previous 260px banner, freeing up ~200px of vertical space so 2-3 ayahs fit per mobile viewport. |
| **Font Scale & Reading Toggles** | LocalStorage state (`wi_quran_font_size`, `wi_quran_show_latin`, `wi_quran_show_translation`) | Instant feedback, client-side persistence, zero server latency. |

---

## 4. Technical System Architecture & Component Map

```
+-----------------------------------------------------------------------+
|                             APP LAYOUT                                |
|  - Sticky Header (64px)                                               |
|  - Scroll Container (pb-24, min-w-0, no horizontal overflow)          |
|  - Fixed Bottom Navigation (60px, grid-cols-5, 10.5px text)           |
+-----------------------------------------------------------------------+
                                   |
    +------------------------------+------------------------------+
    |                              |                              |
[ Home.tsx ]                 [ Ibadah.tsx ]             [ QuranHadis.tsx ]
 - PAI Banner (~48px)         - Prayer Rows (~56px)       - 64px Sticky Header
 - Salam + Date (1 line)      - Checkbox 24px             - 32px Ayah Action Icons
 - 5 Prayer Row (No wrap)     - Unclipped Date Pill       - 26-28px Arabic Text
                              - Compact Sunnah Cards     - A-/A+ Font Scaler
                                                         - Mini Audio Player (56px)
```

---

## 5. Verification & Acceptance Criteria

1. **Mobile Viewport Compliance**: Tested and verified clean layout on 360px, 390px, and 412px widths with zero horizontal body scrollbar.
2. **Typography & Contrast**: Text contrast meets WCAG AA (4.5:1 minimum); no clipped titles or orphan uppercase lines.
3. **Touch Targets & ARIA**: All icon buttons include explicit `aria-label` and `min-h-[40px]`/`min-w-[40px]` hitboxes.
4. **Preservation**: All Firestore cloud sync, audio playback, PWA notifications, and Hadis/Doa Arabic texts operate without regression.
