export const wrapper = document.getElementById('start-screen-wrapper');
export const container = document.getElementById('game-container');
export const canvas = document.getElementById('game');
export const ctx = canvas.getContext('2d');
export const vignette = document.getElementById('vignette');
export const holdBar = document.querySelector('.hold-bar');
export const holdFill = document.getElementById('hold-fill');
export const whiteFlash = document.getElementById('white-flash');
export const startBg = document.getElementById('start-bg');
export const startOverlay = document.getElementById('start-overlay');
export const startScanlines = document.getElementById('start-scanlines');
export const startVignette = document.getElementById('start-vignette');
export const startMenu = document.getElementById('start-menu');

export function resizeCanvas() {
  const s = Math.min(window.innerWidth / 800, window.innerHeight / 600) * 0.98;
  container.style.transform = `scale(${s})`;
  container.style.transformOrigin = 'center center';
  wrapper.style.transform = `scale(${s})`;
  wrapper.style.transformOrigin = 'center center';
}
