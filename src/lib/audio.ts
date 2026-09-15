// Simple Web Audio API synthetic sounds with tone and haptic customisation
// No external dependencies needed

let audioCtx: AudioContext | null = null;

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
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    // ignore
  }
};

let currentAlarmInterval: number | null = null;

export const playAlarmSound = (
  tone: 'azan_makkah' | 'chime_peaceful' | 'beep_classic' = 'azan_makkah',
  type: 'sound_and_vibrate' | 'sound_only' | 'vibrate_only' = 'sound_and_vibrate'
) => {
  const allowVibrate = type === 'sound_and_vibrate' || type === 'vibrate_only';
  const allowSound = type === 'sound_and_vibrate' || type === 'sound_only';

  if (allowVibrate && navigator.vibrate) {
    navigator.vibrate([400, 200, 400, 200, 600]);
  }

  if (!allowSound) {
    return () => {
      if (navigator.vibrate) navigator.vibrate(0);
    };
  }

  const ctx = getAudioContext();
  if (!ctx) return () => {};

  const playSoundOnce = () => {
    try {
      if (tone === 'azan_makkah') {
        // Melodic synthetic takbir motif (Allahu Akbar): notes D4, F4, G4, A4
        const notes = [
          { freq: 293.66, dur: 0.5, delay: 0 },    // D4
          { freq: 349.23, dur: 0.6, delay: 0.5 },  // F4
          { freq: 392.00, dur: 0.8, delay: 1.1 },  // G4
          { freq: 440.00, dur: 1.2, delay: 1.9 },  // A4
        ];
        notes.forEach(({ freq, dur, delay }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
          gain.gain.setValueAtTime(0, ctx.currentTime + delay);
          gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + delay + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + dur);
        });
      } else if (tone === 'chime_peaceful') {
        // Peaceful spiritual chime (528 Hz Solfeggio Love frequency harmonic)
        const chimeFrequencies = [528, 660, 792];
        chimeFrequencies.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.2);
          gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.2);
          gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + idx * 0.2 + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.2 + 1.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.2);
          osc.stop(ctx.currentTime + idx * 0.2 + 1.8);
        });
      } else {
        // Classic digital alarm beeps
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(800, ctx.currentTime + i * 0.2);
          gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.2);
          gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.2 + 0.04);
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.2 + 0.14);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.2);
          osc.stop(ctx.currentTime + i * 0.2 + 0.14);
        }
      }
    } catch (e) {
      console.warn("Audio alarm playback error:", e);
    }
  };

  playSoundOnce();
  const intervalTime = tone === 'azan_makkah' ? 4500 : 3000;
  currentAlarmInterval = window.setInterval(() => {
    playSoundOnce();
    if (allowVibrate && navigator.vibrate) {
      navigator.vibrate([300, 150, 300]);
    }
  }, intervalTime);

  return () => {
    stopAlarmSound();
  };
};

export const stopAlarmSound = () => {
  if (currentAlarmInterval) {
    window.clearInterval(currentAlarmInterval);
    currentAlarmInterval = null;
  }
  if (navigator.vibrate) {
    navigator.vibrate(0);
  }
};

export const testAlarmTone = (
  tone: 'azan_makkah' | 'chime_peaceful' | 'beep_classic',
  type: 'sound_and_vibrate' | 'sound_only' | 'vibrate_only'
) => {
  stopAlarmSound();
  const stop = playAlarmSound(tone, type);
  setTimeout(() => {
    stop();
  }, 3500);
};

export const vibratePrayerAlarm = () => {
  if (navigator.vibrate) {
    navigator.vibrate([400, 200, 400, 200, 600]);
  }
};

export const vibrateSuccess = () => {
  if (navigator.vibrate) {
    navigator.vibrate([80, 40, 80]); // Short double vibration for success
  }
};

