import { CONFIG } from '../config.js';
import { state, svgPaths } from '../state.js';
import { ctx, vignette } from './canvas.js';
import { player, enemy } from '../entities/player.js';
import { cards } from '../entities/card.js';
import { exit } from '../level/generator.js';
import { fogCells } from '../level/fog.js';
import { walls } from '../level/walls.js';

export function draw() {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
  ctx.strokeStyle = 'rgba(0,40,0,0.25)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let x = 0; x <= CONFIG.width; x += CONFIG.gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, CONFIG.height); }
  for (let y = 0; y <= CONFIG.height; y += CONFIG.gridSize) { ctx.moveTo(0, y); ctx.lineTo(CONFIG.width, y); }
  ctx.stroke();

  ctx.fillStyle = '#020'; ctx.strokeStyle = '#0a0'; ctx.lineWidth = 2;
  for (const w of walls) {
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = 'rgba(0,80,0,0.3)';
    ctx.fillRect(w.x + 3, w.y + 3, w.w - 6, w.h - 6);
    ctx.fillStyle = '#020';
  }

  if (exit.active) {
    const p = 1 + Math.sin(Date.now() / 100) * 0.15;
    ctx.fillStyle = `rgba(0,255,0,${0.7 + Math.sin(Date.now() / 80) * 0.2})`;
    ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
    ctx.strokeStyle = '#0f0'; ctx.lineWidth = 2 + p * 0.5;
    ctx.strokeRect(exit.x - 2, exit.y - 2, exit.w + 4, exit.h + 4);
    ctx.fillStyle = '#000'; ctx.font = '9px monospace';
    ctx.fillText('→', exit.x + 8, exit.y + 28);
  }

  for (const card of cards) {
    if (card.collected) continue;
    if (state.echoTimer > 0 && Math.hypot(player.x - card.x, player.y - card.y) < state.currentEchoRadius + 30) {
      const r = card.radius + Math.sin(Date.now() / 80) * 1.5;
      if (svgPaths.card.length > 0) svgPaths.card.forEach(p => drawSVGEl(ctx, p, card.x - 10, card.y - 10));
      else {
        ctx.beginPath(); ctx.arc(card.x, card.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,0,${0.6 + Math.sin(Date.now() / 60) * 0.2})`;
        ctx.fill(); ctx.strokeStyle = '#0f0'; ctx.lineWidth = 2; ctx.stroke();
      }
    }
  }

  if (state.echoTimer > 0) {
    const pr = state.echoTimer / CONFIG.echoDuration;
    const rad = state.currentEchoRadius * (0.7 + 0.3 * pr);
    const g = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, rad);
    g.addColorStop(0, 'rgba(0,255,0,0.18)'); g.addColorStop(0.6, 'rgba(0,255,0,0.06)'); g.addColorStop(1, 'rgba(0,255,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(player.x, player.y, rad, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(0,255,0,${0.25 + Math.sin(Date.now() / 40) * 0.1})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(player.x, player.y, state.currentEchoRadius * pr, 0, Math.PI * 2); ctx.stroke();
  }

  if (svgPaths.player.length > 0) svgPaths.player.forEach(p => drawSVGEl(ctx, p, player.x - 20, player.y - 20));
  else {
    ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.breathHold ? '#0a0' : player.color;
    ctx.fill(); ctx.strokeStyle = player.breathHold ? '#0c0' : '#0f0'; ctx.lineWidth = 2; ctx.stroke();
  }

  if (svgPaths.enemy.length > 0) svgPaths.enemy.forEach(p => drawSVGEl(ctx, p, enemy.x - 20, enemy.y - 20));
  else {
    const eg = enemy.alertPulse > 0 ? enemy.alertPulse : 0;
    ctx.beginPath(); ctx.arc(enemy.x, enemy.y, enemy.radius + eg * 3, 0, Math.PI * 2);
    ctx.fillStyle = enemy.investigate ? '#f88' : enemy.color;
    ctx.fill(); ctx.strokeStyle = enemy.investigate ? '#f44' : '#a22'; ctx.lineWidth = 2 + eg * 2; ctx.stroke();
    ctx.fillStyle = '#000'; ctx.beginPath();
    ctx.arc(enemy.x - 4, enemy.y - 3, 3, 0, Math.PI * 2);
    ctx.arc(enemy.x + 4, enemy.y - 3, 3, 0, Math.PI * 2);
    ctx.fill();
    const ld = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    if (ld < 300) {
      const lx = (player.x - enemy.x) / ld * 1.5, ly = (player.y - enemy.y) / ld * 1.5;
      ctx.fillStyle = '#f00'; ctx.beginPath();
      ctx.arc(enemy.x - 4 + lx, enemy.y - 3 + ly, 1.5, 0, Math.PI * 2);
      ctx.arc(enemy.x + 4 + lx, enemy.y - 3 + ly, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (!enemy.investigate && svgPaths.enemy.length === 0) {
    ctx.save(); ctx.translate(enemy.x, enemy.y); ctx.rotate(enemy.direction);
    ctx.fillStyle = 'rgba(255,50,50,0.04)'; ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.arc(0, 0, CONFIG.enemyVisionRange, -CONFIG.enemyVisionAngle / 2 * Math.PI / 180, CONFIG.enemyVisionAngle / 2 * Math.PI / 180);
    ctx.closePath(); ctx.fill(); ctx.restore();
  }

  for (const c of fogCells) if (c.alpha > 0.01) {
    ctx.fillStyle = `rgba(0,17,0,${c.alpha})`;
    ctx.fillRect(c.x, c.y, CONFIG.fogGridSize, CONFIG.fogGridSize);
  }

  if (state.screenPulse > 0.01) {
    ctx.fillStyle = `rgba(30,0,0,${state.screenPulse})`;
    ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
    state.screenPulse *= 0.88;
  }
}

export function drawSVGEl(c, p, ox, oy) {
  c.save(); c.translate(ox, oy);
  if (p.type === 'rect') {
    if (p.fill) { c.fillStyle = p.fill; c.fillRect(p.x, p.y, p.w, p.h); }
    if (p.stroke) { c.strokeStyle = p.stroke; c.strokeRect(p.x, p.y, p.w, p.h); }
  } else if (p.type === 'circle') {
    c.beginPath(); c.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
    if (p.fill) { c.fillStyle = p.fill; c.fill(); }
    if (p.stroke) { c.strokeStyle = p.stroke; c.stroke(); }
  }
  c.restore();
}
