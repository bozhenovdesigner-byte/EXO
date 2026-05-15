import { playTone } from '../audio/engine.js';
import { loadAllSVGs } from '../assets/svg.js';

export async function runBootSequence() {
  await loadAllSVGs();

  await wait(500);

  playTone(800, 0.1, 'square', 0.05);
  const whiteFlash = document.getElementById('white-flash');
  whiteFlash.style.transition = 'opacity 0.1s';
  whiteFlash.style.opacity = '0.9';
  await wait(100);
  whiteFlash.style.transition = 'opacity 0.4s ease-out';
  whiteFlash.style.opacity = '0';

  const startBg = document.getElementById('start-bg');
  startBg.style.opacity = '1';
  await wait(400);

  document.getElementById('start-overlay').style.opacity = '1';
  document.getElementById('start-scanlines').style.opacity = '0.7';
  document.getElementById('start-vignette').style.opacity = '0.6';

  playTone(50, 2.5, 'sawtooth', 0.03);
  await wait(2500);

  document.getElementById('start-menu').style.opacity = '1';
  playTone(1200, 0.08, 'sine', 0.04);

  typewriterEffect();
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

function typewriterEffect() {
  const menuText = document.getElementById('menu-text');
  const paragraphs = menuText.querySelectorAll('p');
  menuText.style.opacity = '0';

  let delay = 0;
  paragraphs.forEach((p) => {
    const original = p.textContent;
    p.textContent = '';
    p.style.opacity = '0';

    setTimeout(() => {
      p.style.transition = 'opacity 0.3s';
      p.style.opacity = '1';
      let charIdx = 0;
      const interval = setInterval(() => {
        p.textContent = original.slice(0, charIdx + 1);
        charIdx++;
        if (charIdx >= original.length) clearInterval(interval);
      }, 30);
    }, delay);

    delay += original.length * 30 + 200;
  });

  setTimeout(() => { menuText.style.opacity = '1'; }, 0);
}
