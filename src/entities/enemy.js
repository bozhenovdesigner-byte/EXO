import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { player } from './player.js';
import { moveEnemy, lineIntersectsWall } from '../level/walls.js';
import { playTone } from '../audio/sfx.js';
import { handleDeath } from '../ui/death.js';

export const enemy = {
  x: 740, y: 300, radius: 13, color: '#f44', direction: Math.PI,
  patrol: { x: 740, y: 300, radius: 320, angle: 0 },
  investigate: null, alertPulse: 0, stuckFrames: 0, lastX: 0, lastY: 0,
  // Pac-Man style: 0 = try X first, 1 = try Y first
  axisPriority: 0
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
    const tx = enemy.investigate.x;
    const ty = enemy.investigate.y;
    const dx = tx - enemy.x;
    const dy = ty - enemy.y;
    const len = Math.hypot(dx, dy) || 1;

    if (len > 4) {
      // Pac-Man: alternate axis priority each frame
      const tryXFirst = enemy.axisPriority === 0;
      let moved = false;

      if (tryXFirst) {
        // Try X toward target
        if (Math.abs(dx) > 1) {
          const xDir = dx > 0 ? 1 : -1;
          moved = moveEnemy(enemy, xDir, 0, CONFIG.enemyChaseSpeed);
          if (moved) enemy.direction = xDir > 0 ? 0 : Math.PI;
        }
        // If X blocked or aligned, try Y
        if (!moved && Math.abs(dy) > 1) {
          const yDir = dy > 0 ? 1 : -1;
          moved = moveEnemy(enemy, 0, yDir, CONFIG.enemyChaseSpeed);
          if (moved) enemy.direction = yDir > 0 ? Math.PI / 2 : -Math.PI / 2;
        }
      } else {
        // Try Y toward target
        if (Math.abs(dy) > 1) {
          const yDir = dy > 0 ? 1 : -1;
          moved = moveEnemy(enemy, 0, yDir, CONFIG.enemyChaseSpeed);
          if (moved) enemy.direction = yDir > 0 ? Math.PI / 2 : -Math.PI / 2;
        }
        // If Y blocked or aligned, try X
        if (!moved && Math.abs(dx) > 1) {
          const xDir = dx > 0 ? 1 : -1;
          moved = moveEnemy(enemy, xDir, 0, CONFIG.enemyChaseSpeed);
          if (moved) enemy.direction = xDir > 0 ? 0 : Math.PI;
        }
      }

      // If both axes blocked — random wander for a few frames
      if (!moved) {
        enemy.stuckFrames++;
        if (enemy.stuckFrames > 20) {
          // Pick random cardinal direction
          const dirs = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
          const d = dirs[Math.floor(Math.random() * dirs.length)];
          moveEnemy(enemy, d.x, d.y, CONFIG.enemyPatrolSpeed);
          enemy.stuckFrames = 0;
        }
      } else {
        enemy.stuckFrames = 0;
      }

      // Flip axis priority for next frame
      enemy.axisPriority = 1 - enemy.axisPriority;
    } else {
      // Reached investigate point
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
  const ptx = enemy.patrol.x + Math.cos(enemy.patrol.angle) * enemy.patrol.radius;
  const pty = enemy.patrol.y + Math.sin(enemy.patrol.angle) * enemy.patrol.radius;
  const pdx = ptx - enemy.x, pdy = pty - enemy.y, plen = Math.hypot(pdx, pdy) || 1;
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
