import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { player } from './player.js';
import { moveEnemy, canMoveTo, lineIntersectsWall } from '../level/walls.js';
import { playTone } from '../audio/sfx.js';
import { handleDeath } from '../ui/death.js';

export const enemy = {
  x: 740, y: 300, radius: 13, color: '#f44', direction: Math.PI,
  patrol: { x: 740, y: 300, radius: 320, angle: 0 },
  investigate: null, alertPulse: 0, stuckFrames: 0, lastX: 0, lastY: 0
};

export function isInEnemyVision() {
  const dx = player.x - enemy.x, dy = player.y - enemy.y, dist = Math.hypot(dx, dy);
  if (dist > CONFIG.enemyVisionRange) return false;
  if (lineIntersectsWall(enemy.x, enemy.y, player.x, player.y)) return false;
  return true;
}

function pickBestSlideDirection(targetX, targetY) {
  // Try 4 cardinal directions, pick the one that moves and gets closest to target
  const dirs = [
    { x: 1, y: 0 },   // right
    { x: -1, y: 0 },  // left
    { x: 0, y: 1 },   // down
    { x: 0, y: -1 }   // up
  ];
  let best = null;
  let bestDist = Infinity;
  const sp = CONFIG.enemyChaseSpeed;
  for (const d of dirs) {
    const nx = enemy.x + d.x * sp;
    const ny = enemy.y + d.y * sp;
    if (canMoveTo(enemy, nx, ny)) {
      const dist = Math.hypot(targetX - nx, targetY - ny);
      if (dist < bestDist) {
        bestDist = dist;
        best = d;
      }
    }
  }
  return best;
}

export function updateEnemy() {
  if (state.isDead) return;
  if (enemy.alertPulse > 0) { enemy.alertPulse *= 0.94; if (enemy.alertPulse < 0.02) enemy.alertPulse = 0; }
  enemy.lastX = enemy.x; enemy.lastY = enemy.y;

  if (enemy.investigate) {
    const dx = enemy.investigate.x - enemy.x;
    const dy = enemy.investigate.y - enemy.y;
    const len = Math.hypot(dx, dy) || 1;

    if (len > 4) {
      // Check if direct path is free
      const directFree = !lineIntersectsWall(enemy.x, enemy.y, enemy.investigate.x, enemy.investigate.y);

      if (directFree) {
        // Go straight
        moveEnemy(enemy, dx / len, dy / len, CONFIG.enemyChaseSpeed);
        enemy.direction = Math.atan2(dy, dx);
      } else {
        // Blocked — pick slide direction that gets us closest to target
        const slideDir = pickBestSlideDirection(enemy.investigate.x, enemy.investigate.y);
        if (slideDir) {
          moveEnemy(enemy, slideDir.x, slideDir.y, CONFIG.enemyChaseSpeed);
          enemy.direction = Math.atan2(slideDir.y, slideDir.x);
        } else {
          // Completely stuck — small random nudge
          enemy.x += (Math.random() - 0.5) * 4;
          enemy.y += (Math.random() - 0.5) * 4;
        }
      }
    } else {
      const toPx = player.x - enemy.x, toPy = player.y - enemy.y;
      if (Math.hypot(toPx, toPy) < CONFIG.enemyVisionRange) enemy.direction = Math.atan2(toPy, toPx);
      else enemy.direction += (Math.random() - 0.5) * 0.15;
      enemy.investigate.timer--;
      if (enemy.investigate.timer % 25 === 0) playTone(280 + Math.random() * 40, 0.04, 'sine', 0.02);
      if (enemy.investigate.timer <= 0) enemy.investigate = null;
    }
    if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < player.radius + enemy.radius - 2) { handleDeath(); return; }
    return;
  }

  // Patrol mode
  enemy.patrol.angle += 0.006;
  const tx = enemy.patrol.x + Math.cos(enemy.patrol.angle) * enemy.patrol.radius;
  const ty = enemy.patrol.y + Math.sin(enemy.patrol.angle) * enemy.patrol.radius;
  const pdx = tx - enemy.x, pdy = ty - enemy.y, plen = Math.hypot(pdx, pdy) || 1;
  if (plen > 3) {
    moveEnemy(enemy, pdx / plen, pdy / plen, CONFIG.enemyPatrolSpeed);
    enemy.direction = Math.atan2(pdy, pdx);
  } else if (Math.random() < 0.01) {
    enemy.patrol.angle += (Math.random() - 0.5) * 1.5;
  }

  const toPx = player.x - enemy.x, toPy = player.y - enemy.y;
  if (Math.hypot(toPx, toPy) < CONFIG.enemyVisionRange * 0.7) enemy.direction = Math.atan2(toPy, toPx);

  if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < player.radius + enemy.radius - 2) { handleDeath(); return; }
  if (isInEnemyVision()) { handleDeath(); return; }
  if (state.silenceTimer > CONFIG.silenceThreshold && enemy.investigate) enemy.investigate = null;
}
