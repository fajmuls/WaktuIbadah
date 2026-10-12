// Simple Web Audio API synthetic sounds + Real Azan MP3 Audio with volume amplification
// Provides high-volume Azan audio, haptic vibration, and loud sound effects for phone and desktop

let audioCtx: AudioContext | null = null;
let activeAdzanAudio: HTMLAudioElement | null = null;

export const AZAN_AUDIO_URLS = {
  makkah: 'https://ia800203.us.archive.org/31/items/AdhanMakkah/Adhan%20Makkah.mp3',
  subuh: 'https://ia800301.us.archive.org/15/items/AdhanMadinah/Adhan%20Madinah.mp3',
  backup: 'https://cdn.islamic.network/audio/adzan/azan1.mp3'
};

const getAudioContext = () => {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('AudioContext not supported');
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const playClickSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    // ignore
  }
};

let currentAlarmInterval: number | null = null;

/**
 * Play authentic loud Azan audio (or synthetic fallback) + strong phone vibration
 */
export const playAlarmSound = (
  tone: 'azan_makkah' | 'chime_peaceful' | 'beep_classic' = 'azan_makkah',
  type: 'sound_and_vibrate' | 'sound_only' | 'vibrate_only' = 'sound_and_vibrate',
  loudBoost: boolean = true
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

  // 1. If Azan tone is requested, attempt high-fidelity Real MP3 Azan
  if (tone === 'azan_makkah') {
    try {
      stopAlarmSound();
      const azanAudio = new Audio(AZAN_AUDIO_URLS.makkah);
      azanAudio.volume = 1.0;
      activeAdzanAudio = azanAudio;

      const playPromise = azanAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn("Real Azan MP3 blocked or offline, falling back to synthetic takbir:", err);
          playSyntheticTakbir(loudBoost);
        });
      }
    } catch {
      playSyntheticTakbir(loudBoost);
    }
  } else {
    playSyntheticTone(tone, loudBoost);
  }

  const intervalTime = tone === 'azan_makkah' ? 5000 : 3000;
  currentAlarmInterval = window.setInterval(() => {
    if (tone !== 'azan_makkah') {
      playSyntheticTone(tone, loudBoost);
    }
    if (allowVibrate && navigator.vibrate) {
      navigator.vibrate([500, 200, 500]);
    }
  }, intervalTime);

  return () => {
    stopAlarmSound();
  };
};

const playSyntheticTakbir = (loudBoost: boolean = true) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const gainMultiplier = loudBoost ? 0.35 : 0.2;
    // Melodic synthetic takbir motif (Allahu Akbar): notes D4, F4, G4, A4
    const notes = [
      { freq: 293.66, dur: 0.6, delay: 0 },    // D4
      { freq: 349.23, dur: 0.7, delay: 0.6 },  // F4
      { freq: 392.00, dur: 0.9, delay: 1.3 },  // G4
      { freq: 440.00, dur: 1.5, delay: 2.2 },  // A4
    ];

    notes.forEach(({ freq, dur, delay }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(gainMultiplier, ctx.currentTime + delay + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + dur);
    });
  } catch (e) {
    console.warn("Synthetic takbir audio error:", e);
  }
};

const playSyntheticTone = (tone: 'chime_peaceful' | 'beep_classic', loudBoost: boolean = true) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const gainMult = loudBoost ? 0.3 : 0.18;
    if (tone === 'chime_peaceful') {
      const chimeFrequencies = [528, 660, 792];
      chimeFrequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.2);
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.2);
        gain.gain.linearRampToValueAtTime(gainMult, ctx.currentTime + idx * 0.2 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.2 + 1.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.2);
        osc.stop(ctx.currentTime + idx * 0.2 + 1.8);
      });
    } else {
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(850, ctx.currentTime + i * 0.2);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.2);
        gain.gain.linearRampToValueAtTime(gainMult, ctx.currentTime + i * 0.2 + 0.04);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.2 + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.2);
        osc.stop(ctx.currentTime + i * 0.2 + 0.14);
      }
    }
  } catch (e) {
    console.warn("Synthetic tone error:", e);
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
    navigator.vibrate([80, 40, 80]); // Short double vibration for success
  }
};

