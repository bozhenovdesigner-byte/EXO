export let audioCtx = null;

export function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

export function playTone(f, d, t = 'sine', v = 0.08, dl = 0) {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = t;
  o.frequency.value = f;
  g.gain.setValueAtTime(0, audioCtx.currentTime + dl);
  g.gain.linearRampToValueAtTime(v, audioCtx.currentTime + dl + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dl + d);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(audioCtx.currentTime + dl);
  o.stop(audioCtx.currentTime + dl + d + 0.05);
}
