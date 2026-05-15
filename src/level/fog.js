import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { player } from '../entities/player.js';

export let fogCells = [];

export function initFog() {
  fogCells = [];
  const cols = Math.ceil(CONFIG.width / CONFIG.fogGridSize);
  const rows = Math.ceil(CONFIG.height / CONFIG.fogGridSize);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      fogCells.push({
        x: c * CONFIG.fogGridSize,
        y: r * CONFIG.fogGridSize,
        alpha: CONFIG.fogMinAlpha,
        targetAlpha: CONFIG.fogMinAlpha,
        lerpSpeed: CONFIG.fogLerpBase + Math.random() * 0.004
      });
    }
  }
}

export function smoothstep(e0, e1, x) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

export function updateFog(panic) {
  const targetR = state.echoTimer > 0 ? state.currentEchoRadius : CONFIG.fogBaseRadius;
  state.currentFogRadius += (targetR - state.currentFogRadius) * 0.15;
  const margin = state.currentFogRadius + CONFIG.fogFadeMargin + 10;
  const bx = player.x - margin, by = player.y - margin, br = player.x + margin, bt = player.y + margin;
  const modMax = CONFIG.fogMaxAlpha + (Math.sin(Date.now() / 350) * 0.06 * panic);
  for (const c of fogCells) {
    c.alpha += (c.targetAlpha - c.alpha) * c.lerpSpeed;
    if (Math.abs(c.alpha - c.targetAlpha) < 0.01) {
      c.targetAlpha = CONFIG.fogMinAlpha + Math.random() * (modMax - CONFIG.fogMinAlpha);
      c.lerpSpeed = CONFIG.fogLerpBase + Math.random() * 0.004;
    }
    if (c.x > br || c.x + CONFIG.fogGridSize < bx || c.y > bt || c.y + CONFIG.fogGridSize < by) continue;
    const cx = c.x + CONFIG.fogGridSize / 2, cy = c.y + CONFIG.fogGridSize / 2;
    const d = Math.hypot(cx - player.x, cy - player.y);
    if (d < state.currentFogRadius) c.alpha = 0;
    else if (d < state.currentFogRadius + CONFIG.fogFadeMargin) {
      c.alpha *= smoothstep(state.currentFogRadius, state.currentFogRadius + CONFIG.fogFadeMargin, d);
    }
  }
}
