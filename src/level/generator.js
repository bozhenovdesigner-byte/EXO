import { CONFIG, LEVELS } from '../config.js';
import { state } from '../state.js';
import { player } from '../entities/player.js';
import { enemy } from '../entities/enemy.js';
import { cards } from '../entities/card.js';
import { exit } from '../entities/exit.js';
import { walls } from './walls.js';
import { initFog } from './fog.js';
import { updateLevelUI } from '../ui/screens.js';

export function generateRandomCards(count, minDist = 100) {
  const res = []; let att = 0;
  while (res.length < count && att < 200) {
    att++;
    const x = 50 + Math.random() * (CONFIG.width - 100);
    const y = 50 + Math.random() * (CONFIG.height - 100);
    let ok = true;
    for (const w of walls) if (x > w.x - 25 && x < w.x + w.w + 25 && y > w.y - 25 && y < w.y + w.h + 25) { ok = false; break; }
    if (!ok || res.some(c => Math.hypot(x - c.x, y - c.y) < minDist)) continue;
    if (Math.hypot(x - (CONFIG.width - 35), y - CONFIG.height / 2) < 80) continue;
    res.push({ x, y, radius: 7, collected: false, holdProgress: 0 });
  }
  return res.length === count ? res : null;
}

export function generateLevel() {
  const level = LEVELS[state.currentLevel];
  walls.length = 0;
  walls.push(
    { x: 0, y: 0, w: CONFIG.width, h: 18 },
    { x: 0, y: CONFIG.height - 18, w: CONFIG.width, h: 18 },
    { x: 0, y: 0, w: 18, h: CONFIG.height },
    { x: CONFIG.width - 18, y: 0, w: 18, h: CONFIG.height }
  );
  const baseObs = [
    { x: 180, y: 100, w: 30, h: 180 }, { x: 320, y: 420, w: 140, h: 30 },
    { x: 520, y: 150, w: 30, h: 200 }, { x: 200, y: 450, w: 100, h: 30 },
    { x: 600, y: 400, w: 30, h: 120 }, { x: 420, y: 280, w: 60, h: 60 },
    { x: 120, y: 380, w: 80, h: 25 }
  ];
  const extraObs = state.currentLevel >= 1 ? [
    { x: 280, y: 200, w: 25, h: 100 }, { x: 650, y: 100, w: 30, h: 150 },
    { x: 150, y: 250, w: 80, h: 25 }
  ] : [];
  const extraObs3 = state.currentLevel >= 2 ? [
    { x: 450, y: 400, w: 25, h: 120 }, { x: 350, y: 100, w: 100, h: 25 }
  ] : [];
  walls.push(...baseObs, ...extraObs, ...extraObs3);

  const randCards = generateRandomCards(level.cards, 100);
  cards.length = 0;
  if (randCards) cards.push(...randCards);
  else {
    for (let i = 0; i < level.cards; i++)
      cards.push({
        x: 100 + (i * 200) % (CONFIG.width - 200),
        y: 100 + Math.floor(i / 3) * 200,
        radius: 7, collected: false, holdProgress: 0
      });
  }

  exit.active = false;
  exit.x = CONFIG.width - 35;
  exit.y = CONFIG.height / 2 - 25;
  exit.w = 25; exit.h = 50;

  player.x = 50; player.y = CONFIG.height / 2;
  enemy.x = CONFIG.width - 50; enemy.y = CONFIG.height / 2;
  enemy.direction = Math.PI;
  enemy.patrol.radius = level.patrolRadius;
  enemy.patrol.angle = Math.random() * Math.PI * 2;
  enemy.investigate = null;
  enemy.alertPulse = 0;
  enemy.stuckFrames = 0;
  enemy.lastX = enemy.x; enemy.lastY = enemy.y;

  state.cardsFound = 0;
  state.silenceTimer = 0;
  state.echoTimer = 0;
  state.holdingCard = null;
  state.currentFogRadius = CONFIG.fogBaseRadius;
  state.currentEchoRadius = level.echoRadius;
  state.isDead = false;
  document.getElementById('cards').textContent = '0';
  updateLevelUI();
  initFog();
}
