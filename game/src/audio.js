// Tiny WebAudio synth: no audio files, everything is an oscillator blip.
// The context is created on the first user gesture; in screenshot mode
// there is no gesture, so every call silently does nothing.
let ctx = null;
let muted = false;

export function ensureAudio() {
  if (ctx || typeof window === 'undefined') return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  } catch {
    ctx = null;
  }
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, seconds, type, gainValue, slideTo) {
  if (!ctx || muted) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + seconds);
    gain.gain.setValueAtTime(gainValue || 0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + seconds);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + seconds);
  } catch {
    // Audio is decoration; a failure never breaks the game.
  }
}

export function playPickup() {
  tone(880, 0.12, 'sine', 0.07);
  setTimeout(() => tone(1320, 0.16, 'sine', 0.06), 90);
}

export function playAlert() {
  tone(220, 0.35, 'sawtooth', 0.08, 440);
}

export function playLaser() {
  tone(1200, 0.1, 'square', 0.04, 300);
}

export function playTool() {
  tone(520, 0.12, 'triangle', 0.06, 780);
}

export function playBusted() {
  tone(330, 0.5, 'sawtooth', 0.09, 110);
}

export function playWin() {
  tone(523, 0.14, 'sine', 0.07);
  setTimeout(() => tone(659, 0.14, 'sine', 0.07), 130);
  setTimeout(() => tone(784, 0.22, 'sine', 0.07), 260);
}
