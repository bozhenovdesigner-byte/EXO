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

export function updateEnemy() {
  if (state.isDead) return;
  if (enemy.alertPulse > 0) { enemy.alertPulse *= 0.94; if (enemy.alertPulse < 0.02) enemy.alertPulse = 0; }
  enemy.lastX = enemy.x; enemy.lastY = enemy.y;

  if (enemy.investigate) {
    const dx = enemy.investigate.x - enemy.x;
    const dy = enemy.investigate.y - enemy.y;
    const len = Math.hypot(dx, dy) || 1;

    if (len > 4) {
      const moved = moveEnemy(enemy, dx / len, dy / len, CONFIG.enemyChaseSpeed);
      enemy.direction = Math.atan2(dy, dx);

      if (!moved) {
        // Fan-out: search free direction that minimizes distance to target
        const baseAngle = Math.atan2(dy, dx);
        const sp = CONFIG.enemyChaseSpeed;
        let bestAngle = null;
        let bestDist = Infinity;

        for (let i = -12; i <= 12; i++) {
          const a = baseAngle + i * 0.12;
          const nx = enemy.x + Math.cos(a) * sp;
          const ny = enemy.y + Math.sin(a) * sp;
          if (canMoveTo(enemy, nx, ny)) {
            const d = Math.hypot(enemy.investigate.x - nx, enemy.investigate.y - ny);
            if (d < bestDist) {
              bestDist = d;
              bestAngle = a;
            }
          }
        }

        if (bestAngle !== null) {
          enemy.x += Math.cos(bestAngle) * sp;
          enemy.y += Math.sin(bestAngle) * sp;
          enemy.direction = bestAngle;
        } else {
          // Completely stuck — strong bounce
          enemy.x -= (dx / len) * 15;
          enemy.y -= (dy / len) * 15;
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
  const dx = tx - enemy.x, dy = ty - enemy.y, len = Math.hypot(dx, dy) || 1;

  if (len > 3) {
    const moved = moveEnemy(enemy, dx / len, dy / len, CONFIG.enemyPatrolSpeed);
    enemy.direction = Math.atan2(dy, dx);
    if (!moved) {
      enemy.stuckFrames++;
      if (enemy.stuckFrames > 30) {
        const bounce = 18;
        enemy.x -= (dx / len) * bounce;
        enemy.y -= (dy / len) * bounce;
        enemy.patrol.angle += Math.PI + (Math.random() - 0.5) * 1.2;
        enemy.stuckFrames = 0;
      }
    } else {
      enemy.stuckFrames = 0;
    }
  } else if (Math.random() < 0.01) {
    enemy.patrol.angle += (Math.random() - 0.5) * 1.5;
  }

  const toPx = player.x - enemy.x, toPy = player.y - enemy.y;
  if (Math.hypot(toPx, toPy) < CONFIG.enemyVisionRange * 0.7) enemy.direction = Math.atan2(toPy, toPx);

  if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < player.radius + enemy.radius - 2) { handleDeath(); return; }
  if (isInEnemyVision()) { handleDeath(); return; }
  if (state.silenceTimer > CONFIG.silenceThreshold && enemy.investigate) enemy.investigate = null;
}
