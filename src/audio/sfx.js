import { playTone } from './engine.js';

export function playEcho() {
  playTone(920, 0.04, 'square', 0.04);
  playTone(460, 0.06, 'sine', 0.025, 0.02);
}

export function playAlert() {
  playTone(180, 0.15, 'sawtooth', 0.09);
  playTone(90, 0.25, 'sawtooth', 0.12, 0.1);
}

export function playHeartbeat(int) {
  const b = 35 + int * 25;
  playTone(b, 0.06, 'sine', 0.015 + int * 0.04);
  playTone(b * 0.5, 0.08, 'sine', 0.008 + int * 0.02, 0.04);
}

export function playCardCollect() {
  [580, 740, 930].forEach((f, i) => playTone(f, 0.07, 'sine', 0.06, i * 0.05));
}

export function playWin() {
  [523, 659, 784, 1047].forEach((f, i) => playTone(f, 0.18, 'sine', 0.07, i * 0.12));
}

export function playLose() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  playTone(70, 0.4, 'sawtooth', 0.18);
  playTone(45, 0.6, 'square', 0.25, 0.25);
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.value = 25;
  g.gain.value = 0.15;
  o.connect(g);
  g.connect(ctx.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
  o.stop(ctx.currentTime + 1.2);
}

export function playLevelUp() {
  [440, 550, 660, 880].forEach((f, i) => playTone(f, 0.12, 'sine', 0.08, i * 0.1));
}
