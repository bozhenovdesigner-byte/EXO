import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { player } from './player.js';
import { moveEnemy, canMoveTo, lineIntersectsWall } from '../level/walls.js';
import { playTone } from '../audio/sfx.js';
import { handleDeath } from '../ui/death.js';

export const enemy = {
  x: 740, y: 300, radius: 13, color: '#f44', direction: Math.PI,
  patrol: { x: 740, y: 300, radius: 320, angle: 0 },
  investigate: null, alertPulse: 0, stuckFrames: 0, lastX: 0, lastY: 0,
  slide: { active: false, dirX: 0, dirY: 0, side: 1 }
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
      // If sliding along wall, keep sliding until free
      if (enemy.slide.active) {
        const moved = moveEnemy(enemy, enemy.slide.dirX, enemy.slide.dirY, CONFIG.enemyChaseSpeed);
        enemy.direction = Math.atan2(enemy.slide.dirY, enemy.slide.dirX);

        // Check if we now have direct path to target
        if (!lineIntersectsWall(enemy.x, enemy.y, enemy.investigate.x, enemy.investigate.y)) {
          enemy.slide.active = false;
        }
        // If still blocked after 20 frames, try other side
        else if (!moved) {
          enemy.slide.side *= -1;
          const baseAngle = Math.atan2(dy, dx);
          const slideAngle = baseAngle + enemy.slide.side * 0.785;
          enemy.slide.dirX = Math.cos(slideAngle);
          enemy.slide.dirY = Math.sin(slideAngle);
        }

        if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < player.radius + enemy.radius - 2) { handleDeath(); return; }
        return;
      }

      // Normal chase
      const moved = moveEnemy(enemy, dx / len, dy / len, CONFIG.enemyChaseSpeed);
      enemy.direction = Math.atan2(dy, dx);

      if (!moved) {
        // Start wall-slide: rotate ±45° from target direction
        const baseAngle = Math.atan2(dy, dx);
        // Try left first
        let side = -1;
        let slideAngle = baseAngle + side * 0.785;
        let sx = Math.cos(slideAngle);
        let sy = Math.sin(slideAngle);

        if (!canMoveTo(enemy, enemy.x + sx * CONFIG.enemyChaseSpeed, enemy.y + sy * CONFIG.enemyChaseSpeed)) {
          // Try right
          side = 1;
          slideAngle = baseAngle + side * 0.785;
          sx = Math.cos(slideAngle);
          sy = Math.sin(slideAngle);
        }

        enemy.slide.active = true;
        enemy.slide.dirX = sx;
        enemy.slide.dirY = sy;
        enemy.slide.side = side;
      }
    } else {
      enemy.slide.active = false;
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
