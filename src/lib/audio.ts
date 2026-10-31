// Authentic Islamic Planner Audio System with Local Sound Effects Pack & Real Azan
// Features tactile UI feedback, specific prayer chimes, task updates, and ambient background music

let activeAdzanAudio: HTMLAudioElement | null = null;
let activeAmbientAudio: HTMLAudioElement | null = null;
let currentAlarmInterval: number | null = null;

// Sound effect cache map for instant latency-free playback
const audioPool: Record<string, HTMLAudioElement> = {};

function getCachedAudio(src: string): HTMLAudioElement {
  if (!audioPool[src]) {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audioPool[src] = audio;
  }
  return audioPool[src];
}

/**
 * Play an audio file with cloneNode to allow rapid overlapping triggers
 */
function playSoundFile(src: string, volume: number = 0.85): Promise<void> {
  return new Promise((resolve) => {
    try {
      const base = getCachedAudio(src);
      const clone = base.cloneNode() as HTMLAudioElement;
      clone.volume = Math.min(Math.max(volume, 0), 1);
      const playPromise = clone.play();
      if (playPromise !== undefined) {
        playPromise.then(() => resolve()).catch(() => resolve());
      } else {
        resolve();
      }
    } catch {
      resolve();
    }
  });
}

// -------------------------------------------------------------
// UI Sound Effects
// -------------------------------------------------------------

export const playButtonTapSound = () => {
  playSoundFile('/audio/ui_button_tap.mp3', 0.9);
  if (navigator.vibrate) navigator.vibrate(25);
};

export const playToggleSound = () => {
  playSoundFile('/audio/ui_toggle.mp3', 0.8);
  if (navigator.vibrate) navigator.vibrate(30);
};

export const playTabSwitchSound = () => {
  playSoundFile('/audio/ui_tab_switch.mp3', 0.75);
};

export const playSaveSuccessSound = () => {
  playSoundFile('/audio/ui_save_success.mp3', 1.0);
  if (navigator.vibrate) navigator.vibrate([60, 40, 90]);
};

export const playDeleteSound = () => {
  playSoundFile('/audio/ui_delete.mp3', 0.85);
  if (navigator.vibrate) navigator.vibrate(50);
};

export const playErrorSound = () => {
  playSoundFile('/audio/ui_error.mp3', 1.0);
  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
};

export const playClickSound = () => {
  playButtonTapSound();
};

// -------------------------------------------------------------
// Dhikr & Worship Sounds
// -------------------------------------------------------------

export const playDhikrTapSound = () => {
  playSoundFile('/audio/dhikr_counter_tap.mp3', 1.0);
  if (navigator.vibrate) navigator.vibrate(35);
};

export const playPrayerCompletedSound = () => {
  playSoundFile('/audio/prayer_completed.mp3', 1.0);
  if (navigator.vibrate) navigator.vibrate([80, 50, 80]);
};

export const playPrayerSound = (prayerName: string) => {
  const norm = prayerName.toLowerCase();
  let file = '/audio/notification_general.mp3';
  if (norm.includes('subuh') || norm.includes('fajr')) {
    file = '/audio/prayer_fajr.mp3';
  } else if (norm.includes('zuhur') || norm.includes('dhuhr')) {
    file = '/audio/prayer_dhuhr.mp3';
  } else if (norm.includes('asar') || norm.includes('asr')) {
    file = '/audio/prayer_asr.mp3';
  } else if (norm.includes('magrib') || norm.includes('maghrib')) {
    file = '/audio/prayer_maghrib.mp3';
  } else if (norm.includes('isya') || norm.includes('isha')) {
    file = '/audio/prayer_isha.mp3';
  } else if (norm.includes('imsak')) {
    file = '/audio/prayer_imsak.mp3';
  }
  return playSoundFile(file, 1.0);
};

// -------------------------------------------------------------
// Tasks & Schedule Sounds
// -------------------------------------------------------------

export const playTaskStateSound = (state: 'completed' | 'urgent' | 'soon' | 'overdue') => {
  switch (state) {
    case 'completed':
      playSoundFile('/audio/task_completed.mp3', 1.0);
      if (navigator.vibrate) navigator.vibrate([70, 40, 70]);
      break;
    case 'urgent':
      playSoundFile('/audio/task_deadline_urgent.mp3', 1.0);
      if (navigator.vibrate) navigator.vibrate([150, 50, 150]);
      break;
    case 'soon':
      playSoundFile('/audio/task_deadline_soon.mp3', 0.9);
      break;
    case 'overdue':
      playSoundFile('/audio/task_overdue.mp3', 1.0);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      break;
  }
};

export const playScheduleEventSound = (type: 'created' | 'start' | 'reminder') => {
  switch (type) {
    case 'created':
      playSoundFile('/audio/schedule_created.mp3', 0.9);
      break;
    case 'start':
      playSoundFile('/audio/schedule_start.mp3', 1.0);
      break;
    case 'reminder':
      playSoundFile('/audio/schedule_reminder.mp3', 1.0);
      break;
  }
};

// -------------------------------------------------------------
// Quran & Focus Session Sounds
// -------------------------------------------------------------

export const playFocusSound = (type: 'start' | 'end') => {
  if (type === 'start') {
    playSoundFile('/audio/focus_session_start.mp3', 1.0);
  } else {
    playSoundFile('/audio/focus_session_end.mp3', 1.0);
  }
};

export const playQuranSound = (type: 'open' | 'bookmark_saved' | 'bookmark_removed' | 'goal_complete') => {
  switch (type) {
    case 'open':
      playSoundFile('/audio/quran_open.mp3', 0.85);
      break;
    case 'bookmark_saved':
      playSoundFile('/audio/quran_bookmark_saved.mp3', 0.9);
      if (navigator.vibrate) navigator.vibrate(40);
      break;
    case 'bookmark_removed':
      playSoundFile('/audio/quran_bookmark_removed.mp3', 0.8);
      break;
    case 'goal_complete':
      playSoundFile('/audio/quran_reading_goal_complete.mp3', 1.0);
      if (navigator.vibrate) navigator.vibrate([100, 50, 150]);
      break;
  }
};

export const playGeneralNotificationSound = () => {
  playSoundFile('/audio/notification_general.mp3', 1.0);
};

// -------------------------------------------------------------
// Ambient Background Music Loop (Focus & Tilawah)
// -------------------------------------------------------------

export const playAmbientLoop = (volume: number = 0.5) => {
  if (activeAmbientAudio) {
    activeAmbientAudio.play().catch(() => {});
    return;
  }
  try {
    const ambient = new Audio('/audio/instrumental_ambient_islamic_90s_loop.mp3');
    ambient.loop = true;
    ambient.volume = Math.min(Math.max(volume, 0), 1);
    activeAmbientAudio = ambient;
    ambient.play().catch((err) => {
      console.debug('Ambient autoplay paused:', err);
    });
  } catch (err) {
    console.debug('Ambient audio error:', err);
  }
};

export const stopAmbientLoop = () => {
  if (activeAmbientAudio) {
    try {
      activeAmbientAudio.pause();
      activeAmbientAudio.currentTime = 0;
    } catch {}
    activeAmbientAudio = null;
  }
};

export const isAmbientPlaying = (): boolean => {
  return !!activeAmbientAudio && !activeAmbientAudio.paused;
};

export const toggleAmbientLoop = (volume: number = 0.5): boolean => {
  if (isAmbientPlaying()) {
    stopAmbientLoop();
    return false;
  } else {
    playAmbientLoop(volume);
    return true;
  }
};

// -------------------------------------------------------------
// Real Azan Audio & Full Screen Alarms
// -------------------------------------------------------------

export const AZAN_AUDIO_URLS = {
  subuh: '/audio/azan-subuh.mp3',
  fardhu: '/audio/azan-fardhu.mp3',
  makkah: '/audio/azan-fardhu.mp3',
  subuhFallback: 'https://cdn.jsdelivr.net/gh/Kiwifu/adhan-mp3@master/Adhan_Fajr_Al_Haram_Al_Maki_(%D8%A3%D8%B0%D8%A7%D9%86_%D8%A7%D9%84%D9%81%D8%AC%D8%B1_%D8%A7%D9%84%D8%AD%D8%B1%D9%85_%D8%A7%D9%84%D9%85%D9%83%D9%8A).mp3',
  fardhuFallback: 'https://cdn.jsdelivr.net/gh/Kiwifu/adhan-mp3@master/Adhan_Al_Haram_Al_Madani_-_Al_Madinah_1_(%D8%A3%D8%B0%D8%A7%D9%86_%D8%A7%D9%84%D8%AD%D8%B1%D9%85_%D8%A7%D9%84%D9%85%D8%AF%D9%86%D9%8A_-_%D8%A7%D9%84%D9%85%D8%AF%D9%8A%D9%86%D8%A9_%D8%A7%D9%84%D9%85%D9%86%D9%88%D8%B1%D8%A9).mp3'
};

export const playPrayerAzan = (
  prayerName: string,
  type: 'sound_and_vibrate' | 'sound_only' | 'vibrate_only' = 'sound_and_vibrate'
) => {
  stopAlarmSound();
  const allowVibrate = type === 'sound_and_vibrate' || type === 'vibrate_only';
  const allowSound = type === 'sound_and_vibrate' || type === 'sound_only';

  if (allowVibrate && navigator.vibrate) {
    navigator.vibrate([800, 300, 800, 300, 1200]);
  }

  if (!allowSound) {
    return () => stopAlarmSound();
  }

  const isSubuh = prayerName.toLowerCase().includes('subuh');
  const targetUrl = isSubuh ? AZAN_AUDIO_URLS.subuh : AZAN_AUDIO_URLS.fardhu;
  const fallbackUrl = isSubuh ? AZAN_AUDIO_URLS.subuhFallback : AZAN_AUDIO_URLS.fardhuFallback;

  try {
    const azanAudio = new Audio(targetUrl);
    azanAudio.volume = 1.0;
    activeAdzanAudio = azanAudio;

    azanAudio.onerror = () => {
      console.warn("Local Azan audio unavailable, playing fallback CDN:", fallbackUrl);
      const fallbackAudio = new Audio(fallbackUrl);
      fallbackAudio.volume = 1.0;
      activeAdzanAudio = fallbackAudio;
      fallbackAudio.play().catch(() => playPrayerSound(prayerName));
    };

    const playPromise = azanAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        const fallbackAudio = new Audio(fallbackUrl);
        fallbackAudio.volume = 1.0;
        activeAdzanAudio = fallbackAudio;
        fallbackAudio.play().catch(() => playPrayerSound(prayerName));
      });
    }
  } catch {
    playPrayerSound(prayerName);
  }

  if (allowVibrate && navigator.vibrate) {
    currentAlarmInterval = window.setInterval(() => {
      if (navigator.vibrate) {
        navigator.vibrate([600, 200, 600]);
      }
    }, 4000);
  }

  return () => {
    stopAlarmSound();
  };
};

export const playAlarmSound = (
  tone: 'azan_makkah' | 'chime_peaceful' | 'beep_classic' = 'azan_makkah',
  type: 'sound_and_vibrate' | 'sound_only' | 'vibrate_only' = 'sound_and_vibrate',
  _loudBoost: boolean = true,
  prayerName?: string
) => {
  const allowVibrate = type === 'sound_and_vibrate' || type === 'vibrate_only';
  const allowSound = type === 'sound_and_vibrate' || type === 'sound_only';

  if (allowVibrate && navigator.vibrate) {
    navigator.vibrate([600, 250, 600, 250, 900]);
  }

  if (!allowSound) {
    return () => {
      if (navigator.vibrate) navigator.vibrate(0);
    };
  }

  if (tone === 'azan_makkah') {
    return playPrayerAzan(prayerName || 'Zuhur', type);
  } else {
    // Play notification general audio as chime/alarm
    playSoundFile('/audio/notification_general.mp3', 1.0);
    currentAlarmInterval = window.setInterval(() => {
      playSoundFile('/audio/notification_general.mp3', 1.0);
      if (allowVibrate && navigator.vibrate) {
        navigator.vibrate([500, 200, 500]);
      }
    }, 3000);

    return () => {
      stopAlarmSound();
    };
  }
};

export const stopAlarmSound = () => {
  if (currentAlarmInterval) {
    window.clearInterval(currentAlarmInterval);
    currentAlarmInterval = null;
  }
  if (activeAdzanAudio) {
    try {
      activeAdzanAudio.pause();
      activeAdzanAudio.currentTime = 0;
    } catch {}
    activeAdzanAudio = null;
  }
  if (navigator.vibrate) {
    navigator.vibrate(0);
  }
};

export const testAlarmTone = (
  tone: 'azan_makkah' | 'chime_peaceful' | 'beep_classic',
  type: 'sound_and_vibrate' | 'sound_only' | 'vibrate_only',
  durationMs: number = 4000
) => {
  stopAlarmSound();
  const stop = playAlarmSound(tone, type, true);
  setTimeout(() => {
    stop();
  }, durationMs);
};

export const vibratePrayerAlarm = () => {
  if (navigator.vibrate) {
    navigator.vibrate([600, 200, 600, 200, 900]);
  }
};

export const vibrateSuccess = () => {
  if (navigator.vibrate) {
    navigator.vibrate([80, 40, 80]);
  }
};
