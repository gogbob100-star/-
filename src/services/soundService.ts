// Web Audio API synthesized sounds & ambient studio (zero external dependencies, 100% offline & instant)

export type SoundEffectType = 'save' | 'export' | 'success' | 'action' | 'delete' | 'tap';

let audioCtx: AudioContext | null = null;
let ambientSource: AudioNode | null = null;
let ambientGain: GainNode | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playSound(type: SoundEffectType = 'action') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    switch (type) {
      case 'save': {
        // Soft, calming warm tone (C5 -> E5)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
        break;
      }
      case 'export':
      case 'success': {
        // Gentle major chord fanfare (C5 -> G5 -> C6)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.09);
        osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.18);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        osc.start(now);
        osc.stop(now + 0.38);
        break;
      }
      case 'delete': {
        // Soft low minor drop
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.15);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }
      case 'tap':
      case 'action':
      default: {
        // Subtile gentle click/pop
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }
    }
  } catch {
    // Fail silently if audio is blocked by browser policy
  }
}

// Sound Studio with Typewriter and Ambient Generators
export const soundStudio = {
  playTypewriterKey: () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      // Random mechanical pitch variance
      const freq = 400 + Math.random() * 250;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.035);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch {}
  },

  playTypewriter: () => {
    soundStudio.playTypewriterKey();
  },

  setAmbient: (type: string, volume = 0.15) => {
    try {
      soundStudio.stopAmbient();
      if (type === 'none') return;

      const ctx = getAudioContext();
      if (!ctx) return;

      // Synthesize ambient white/pink noise or rainfall/fire generator
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        if (type === 'rain') {
          // Soft pinkish rain sound
          data[i] = (Math.random() * 2 - 1) * 0.4;
        } else if (type === 'fire') {
          // Fire crackle noise
          data[i] = (Math.random() * 2 - 1) * 0.3 * (Math.random() > 0.98 ? 2 : 0.8);
        } else {
          // Gentle ambient white noise
          data[i] = (Math.random() * 2 - 1) * 0.2;
        }
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Filter to soften ambient noise
      const filter = ctx.createBiquadFilter();
      filter.type = type === 'rain' ? 'lowpass' : type === 'fire' ? 'bandpass' : 'lowpass';
      filter.frequency.value = type === 'rain' ? 800 : type === 'fire' ? 600 : 500;

      ambientGain = ctx.createGain();
      ambientGain.gain.setValueAtTime(volume, ctx.currentTime);

      noise.connect(filter);
      filter.connect(ambientGain);
      ambientGain.connect(ctx.destination);

      noise.start();
      ambientSource = noise;
    } catch {}
  },

  stopAmbient: () => {
    try {
      if (ambientSource) {
        (ambientSource as any).stop?.();
        ambientSource.disconnect();
        ambientSource = null;
      }
      if (ambientGain) {
        ambientGain.disconnect();
        ambientGain = null;
      }
    } catch {}
  },

  setVolume: (vol: number) => {
    if (ambientGain && audioCtx) {
      ambientGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), audioCtx.currentTime);
    }
  },
};
