import { audioCtx } from './engine.js';

let ambientNodes = null;

export function playAmbient() {
  if (!audioCtx || ambientNodes) return;
  const o1 = audioCtx.createOscillator();
  const o2 = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();

  o1.type = 'triangle'; o1.frequency.value = 38;
  o2.type = 'sine'; o2.frequency.value = 42;
  lfo.type = 'sine'; lfo.frequency.value = 0.08;
  lfoGain.gain.value = 8;
  lfo.connect(lfoGain);
  lfoGain.connect(o2.frequency);

  g.gain.value = 0.012;
  o1.connect(g); o2.connect(g);
  g.connect(audioCtx.destination);

  o1.start(); o2.start(); lfo.start();
  ambientNodes = { o1, o2, g, lfo, lfoGain };

  const d = 8000 + Math.random() * 4000;
  setTimeout(() => {
    if (ambientNodes) {
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2);
      setTimeout(() => { stopAmbient(); playAmbient(); }, 2000);
    }
  }, d);
}

export function stopAmbient() {
  if (!ambientNodes) return;
  ambientNodes.o1.stop(); ambientNodes.o2.stop(); ambientNodes.lfo.stop();
  ambientNodes = null;
}
