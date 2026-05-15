import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { player } from './player.js';
import { moveEnemy, canMoveTo, lineIntersectsWall, walls } from '../level/walls.js';
import { playTone } from '../audio/sfx.js';
import { handleDeath } from '../ui/death.js';

export const enemy = {
  x: 740, y: 300, radius: 13, color: '#f44', direction: Math.PI,
  patrol: { x: 740, y: 300, radius: 320, angle: 0 },
  investigate: null, alertPulse: 0, stuckFrames: 0, lastX: 0, lastY: 0,
  // wall-follow state
  wf: { active: false, side: 0, wall: null }
};

export function isInEnemyVision() {
  const dx = player.x - enemy.x, dy = player.y - enemy.y, dist = Math.hypot(dx, dy);
  if (dist > CONFIG.enemyVisionRange) return false;
  if (lineIntersectsWall(enemy.x, enemy.y, player.x, player.y)) return false;
  return true;
}

function findBlockingWall(nx, ny) {
  const r = enemy.radius * 0.7;
  for (const w of walls) {
    if (circleRectCollision(nx, ny, r, w)) return w;
  }
  return null;
}

function circleRectCollision(cx, cy, r, rect) {
  const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  return ((cx - closestX) ** 2 + (cy - closestY) ** 2) < (r * r);
}

function pickSlideSide(wall, targetX, targetY) {
  // Wall is vertical or horizontal
  const isVert = wall.h > wall.w;
  let side1, side2;
  if (isVert) {
    side1 = { x: 0, y: -1 };  // up
    side2 = { x: 0, y: 1 };   // down
  } else {
    side1 = { x: -1, y: 0 };  // left
    side2 = { x: 1, y: 0 };   // right
  }
  // Pick side that gets us closer to target
  const d1 = Math.hypot(targetX - (enemy.x + side1.x * 30), targetY - (enemy.y + side1.y * 30));
  const d2 = Math.hypot(targetX - (enemy.x + side2.x * 30), targetY - (enemy.y + side2.y * 30));
  return d1 < d2 ? side1 : side2;
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

      if (directFree && !enemy.wf.active) {
        // Clear path — go straight
        moveEnemy(enemy, dx / len, dy / len, CONFIG.enemyChaseSpeed);
        enemy.direction = Math.atan2(dy, dx);
      } else if (enemy.wf.active) {
        // Wall-following: keep sliding along remembered wall
        const moved = moveEnemy(enemy, enemy.wf.side.x, enemy.wf.side.y, CONFIG.enemyChaseSpeed);
        enemy.direction = Math.atan2(enemy.wf.side.y, enemy.wf.side.x);

        // If we now have direct line to target, exit wall-follow
        if (directFree) {
          enemy.wf.active = false;
          enemy.wf.wall = null;
        }
        // If blocked by same wall, keep sliding (don't change side)
        else if (!moved) {
          // Try opposite side of same wall
          enemy.wf.side.x *= -1;
          enemy.wf.side.y *= -1;
        }
      } else {
        // Blocked and not wall-following yet: start wall-follow
        const nx = enemy.x + (dx / len) * CONFIG.enemyChaseSpeed;
        const ny = enemy.y + (dy / len) * CONFIG.enemyChaseSpeed;
        const wall = findBlockingWall(nx, ny);

        if (wall) {
          const side = pickSlideSide(wall, enemy.investigate.x, enemy.investigate.y);
          enemy.wf.active = true;
          enemy.wf.side = side;
          enemy.wf.wall = wall;
          // Move one step in slide direction
          moveEnemy(enemy, side.x, side.y, CONFIG.enemyChaseSpeed);
          enemy.direction = Math.atan2(side.y, side.x);
        } else {
          // Shouldn't happen, but fallback
          moveEnemy(enemy, dx / len, dy / len, CONFIG.enemyChaseSpeed);
          enemy.direction = Math.atan2(dy, dx);
        }
      }
    } else {
      // Reached investigate point
      enemy.wf.active = false;
      enemy.wf.wall = null;
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
    const moved = moveEnemy(enemy, pdx / plen, pdy / plen, CONFIG.enemyPatrolSpeed);
    enemy.direction = Math.atan2(pdy, pdx);
    if (!moved) {
      enemy.stuckFrames++;
      if (enemy.stuckFrames > 30) {
        enemy.x -= (pdx / plen) * 18;
        enemy.y -= (pdy / plen) * 18;
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
