import { CONFIG } from '../config.js';

export let fogCells = [];

export function initFog() {
  fogCells = [];
  const cols = Math.ceil(CONFIG.width / CONFIG.fogGridSize);
  const rows = Math.ceil(CONFIG.height / CONFIG.fogGridSize);
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      fogCells.push({
        x: c * CONFIG.fogGridSize,
        y: r * CONFIG.fogGridSize,
        alpha: CONFIG.fogMinAlpha,
        targetAlpha: CONFIG.fogMinAlpha,
        lerpSpeed: CONFIG.fogLerpBase + Math.random() * 0.004
      });
}

export function smoothstep(e0, e1, x) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}
