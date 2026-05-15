import { CONFIG } from '../config.js';

export const canvas = document.getElementById('game');
export const ctx = canvas.getContext('2d');
export const container = document.getElementById('game-container');
export const wrapper = document.getElementById('start-screen-wrapper');
export const vignette = document.getElementById('vignette');

export function resizeCanvas() {
  const s = Math.min(window.innerWidth / CONFIG.width, window.innerHeight / CONFIG.height) * 0.98;
  container.style.transform = `scale(${s})`;
  container.style.transformOrigin = 'center center';
  wrapper.style.transform = `scale(${s})`;
  wrapper.style.transformOrigin = 'center center';
}
