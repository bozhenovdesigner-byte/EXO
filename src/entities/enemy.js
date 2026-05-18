import { CONFIG } from '../config.js';
import { state, playerTrail } from '../state.js';
import { player } from './player.js';
import { moveEnemy, canMoveTo, lineIntersectsWall } from '../level/walls.js';
import { playTone } from '../audio/sfx.js';
import { handleDeath } from '../ui/death.js';

export const enemy = {
  x: 740, y: 300, radius: 13, color: '#f44', direction: Math.PI,
  patrol: { x: 740, y: 300, radius: 320, angle: 0 },
  investigate: null, alertPulse: 0, stuckFrames: 0, lastX: 0, lastY: 0,
  axisPriority: 0
};

export function isInEnemyVision() {
  const dx = player.x - enemy.x, dy = player.y - enemy.y, dist = Math.hypot(dx, dy);
  if (dist > CONFIG.enemyVisionRange) return false;
  if (lineIntersectsWall(enemy.x, enemy.y, player.x, player.y)) return false;
  return true;
}

// Pure movement: check canMoveTo, then apply position directly
function tryMove(obj, dirX, dirY, speed) {
  const nx = obj.x + dirX * speed;
  const ny = obj.y + dirY * speed;
  if (canMoveTo(obj, nx, ny)) {
    obj.x = nx;
    obj.y = ny;
    return true;
  }
  return false;
}

// Find best trail point: closest to enemy with line-of-sight to target
function findBestTrailPoint() {
  if (!playerTrail || playerTrail.length === 0) return null;
  let best = null;
  let bestDist = Infinity;
  for (const p of playerTrail) {
    // Check if from this point we can see the investigate target
    const targetX = enemy.investigate ? enemy.investigate.x : player.x;
    const targetY = enemy.investigate ? enemy.investigate.y : player.y;
    if (!lineIntersectsWall(p.x, p.y, targetX, targetY)) {
      const d = Math.hypot(enemy.x - p.x, enemy.y - p.y);
      if (d < bestDist) {
        bestDist = d;
        best = p;
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
    // Chase player only on direct contact, not on vision
    // (Removed vision-based chase to prevent instant death in radius)

    // Scent Trail: find best point to go to
    const trailPoint = findBestTrailPoint();
    let tx, ty;
    if (trailPoint) {
      tx = trailPoint.x;
      ty = trailPoint.y;
    } else {
      tx = enemy.investigate.x;
      ty = enemy.investigate.y;
    }

    const dx = tx - enemy.x;
    const dy = ty - enemy.y;
    const len = Math.hypot(dx, dy) || 1;

    if (len > 4) {
      const sp = 1.8;
      let moved = false;

      // Priority axis: try X first or Y first
      if (enemy.axisPriority === 0) {
        if (Math.abs(dx) > 1) {
          const xDir = dx > 0 ? 1 : -1;
          moved = tryMove(enemy, xDir, 0, sp);
          if (moved) enemy.direction = xDir > 0 ? 0 : Math.PI;
        }
        if (!moved && Math.abs(dy) > 1) {
          const yDir = dy > 0 ? 1 : -1;
          moved = tryMove(enemy, 0, yDir, sp);
          if (moved) enemy.direction = yDir > 0 ? Math.PI / 2 : -Math.PI / 2;
        }
      } else {
        if (Math.abs(dy) > 1) {
          const yDir = dy > 0 ? 1 : -1;
          moved = tryMove(enemy, 0, yDir, sp);
          if (moved) enemy.direction = yDir > 0 ? Math.PI / 2 : -Math.PI / 2;
        }
        if (!moved && Math.abs(dx) > 1) {
          const xDir = dx > 0 ? 1 : -1;
          moved = tryMove(enemy, xDir, 0, sp);
          if (moved) enemy.direction = xDir > 0 ? 0 : Math.PI;
        }
      }

      // If both primary axes blocked, try perpendiculars
      if (!moved) {
        const perps = [];
        if (Math.abs(dx) > Math.abs(dy)) {
          perps.push({ x: 0, y: 1 }, { x: 0, y: -1 });
        } else {
          perps.push({ x: 1, y: 0 }, { x: -1, y: 0 });
        }
        for (const p of perps) {
          moved = tryMove(enemy, p.x, p.y, sp);
          if (moved) {
            enemy.direction = Math.atan2(p.y, p.x);
            break;
          }
        }
      }

      // If completely stuck — random nudge
      if (!moved) {
        enemy.stuckFrames++;
        if (enemy.stuckFrames > 15) {
          const dirs = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
          const d = dirs[Math.floor(Math.random() * dirs.length)];
          tryMove(enemy, d.x, d.y, sp * 0.5);
          enemy.stuckFrames = 0;
        }
      } else {
        enemy.stuckFrames = 0;
      }

      enemy.axisPriority = 1 - enemy.axisPriority;
    } else {
      // Reached trail point or investigate point
      const toPx = player.x - enemy.x, toPy = player.y - enemy.y;
      if (Math.hypot(toPx, toPy) < CONFIG.enemyVisionRange) enemy.direction = Math.atan2(toPy, toPx);
      else enemy.direction += (Math.random() - 0.5) * 0.15;
      enemy.investigate.timer--;
      if (enemy.investigate.timer % 25 === 0) playTone(280 + Math.random() * 40, 0.04, 'sine', 0.02);
      if (enemy.investigate.timer <= 0) {
        enemy.investigate = null;
        playerTrail.length = 0;
        enemy.alertPulse = 0.5; // Brief "confused" pulse when losing interest
      }
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
  if (state.silenceTimer > CONFIG.silenceThreshold && enemy.investigate) enemy.investigate = null;
}
