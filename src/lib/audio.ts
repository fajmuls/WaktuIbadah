// Simple Web Audio API synthetic sounds
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
  // Resume context if suspended (common browser policy)
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

export const playAlarmSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return () => {};
  
  if (navigator.vibrate) {
    // Vibrate intensely
    navigator.vibrate([500, 250, 500, 250, 500, 250, 500]);
  }
  
  const playBeep = () => {
    try {
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, ctx.currentTime + i * 0.2);
        
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.2);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.2 + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.2 + 0.15);
        
        osc.start(ctx.currentTime + i * 0.2);
        osc.stop(ctx.currentTime + i * 0.2 + 0.15);
      }
    } catch (e) {
      // ignore
    }
  };

  playBeep(); // Play immediately
  // Loop the beep every 2 seconds
  currentAlarmInterval = window.setInterval(playBeep, 2000);

  // Return a stop function
  return () => {
    if (currentAlarmInterval) {
      window.clearInterval(currentAlarmInterval);
      currentAlarmInterval = null;
    }
    if (navigator.vibrate) {
      navigator.vibrate(0); // stop vibration
    }
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

export const vibrateSuccess = () => {
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100]); // Short double vibration for success (like logging ibadah)
  }
};

