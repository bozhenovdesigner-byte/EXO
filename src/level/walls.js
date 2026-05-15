import { CONFIG } from '../config.js';

export let walls = [];

export function circleRectCollision(cx, cy, r, rect) {
  const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  return ((cx - closestX) ** 2 + (cy - closestY) ** 2) < (r * r);
}

export function lineIntersectsWall(x1, y1, x2, y2) {
  for (const w of walls) {
    if (x1 < w.x - 5 && x2 < w.x - 5 || x1 > w.x + w.w + 5 && x2 > w.x + w.w + 5 || y1 < w.y - 5 && y2 < w.y - 5 || y1 > w.y + w.h + 5 && y2 > w.y + w.h + 5) continue;
    const s = [
      { x1: w.x, y1: w.y, x2: w.x + w.w, y2: w.y },
      { x1: w.x, y1: w.y + w.h, x2: w.x + w.w, y2: w.y + w.h },
      { x1: w.x, y1: w.y, x2: w.x, y2: w.y + w.h },
      { x1: w.x + w.w, y1: w.y, x2: w.x + w.w, y2: w.y + w.h }
    ];
    for (const q of s) {
      const d = (q.y2 - q.y1) * (x2 - x1) - (q.x2 - q.x1) * (y2 - y1);
      if (Math.abs(d) < 0.01) continue;
      const ua = ((q.x2 - q.x1) * (y1 - q.y1) - (q.y2 - q.y1) * (x1 - q.x1)) / d;
      const ub = ((x2 - x1) * (y1 - q.y1) - (y2 - y1) * (x1 - q.x1)) / d;
      if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) return true;
    }
  }
  return false;
}

export function moveWithCollision(obj, dx, dy, sp) {
  const nx = obj.x + dx * sp, ny = obj.y + dy * sp;
  let cx = true, cy = true;
  for (const w of walls) {
    if (circleRectCollision(nx, obj.y, obj.radius, w)) cx = false;
    if (circleRectCollision(obj.x, ny, obj.radius, w)) cy = false;
  }
  if (cx) obj.x = nx;
  if (cy) obj.y = ny;
  obj.x = Math.max(obj.radius + 2, Math.min(CONFIG.width - obj.radius - 2, obj.x));
  obj.y = Math.max(obj.radius + 2, Math.min(CONFIG.height - obj.radius - 2, obj.y));
}


export function moveEnemy(obj, dx, dy, sp) {
  const r = obj.radius * 0.7;
  const tryMove = (ndx, ndy) => {
    const nx = obj.x + ndx * sp;
    const ny = obj.y + ndy * sp;
    for (const w of walls) {
      if (circleRectCollision(nx, ny, r, w)) return false;
    }
    obj.x = nx; obj.y = ny;
    obj.x = Math.max(r + 2, Math.min(CONFIG.width - r - 2, obj.x));
    obj.y = Math.max(r + 2, Math.min(CONFIG.height - r - 2, obj.y));
    return true;
  };

  // 1. Try full diagonal movement
  if (tryMove(dx, dy)) return true;

  // 2. Wall sliding: X-only, then Y-only
  let moved = false;
  if (tryMove(dx, 0)) moved = true;
  if (tryMove(0, dy)) moved = true;
  if (moved) return true;

  // 3. Corner nudge: try ±30° from original direction
  const angle = Math.atan2(dy, dx);
  for (const offset of [0.52, -0.52]) {
    const a = angle + offset;
    if (tryMove(Math.cos(a), Math.sin(a))) return true;
  }

  // 4. Desperate nudge: try perpendicular directions
  const perp1 = Math.atan2(dy, dx) + Math.PI / 2;
  const perp2 = Math.atan2(dy, dx) - Math.PI / 2;
  if (tryMove(Math.cos(perp1), Math.sin(perp1))) return true;
  if (tryMove(Math.cos(perp2), Math.sin(perp2))) return true;

  return false;
}
