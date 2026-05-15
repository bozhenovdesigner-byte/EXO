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

export function canMoveTo(obj, nx, ny) {
  const r = obj.radius * 0.7;
  for (const w of walls) {
    if (circleRectCollision(nx, ny, r, w)) return false;
  }
  return true;
}

export function moveEnemy(obj, dx, dy, sp) {
  const r = obj.radius * 0.7;
  const nx = obj.x + dx * sp;
  const ny = obj.y + dy * sp;

  // 1. Full diagonal
  let blocked = false;
  for (const w of walls) {
    if (circleRectCollision(nx, ny, r, w)) { blocked = true; break; }
  }
  if (!blocked) {
    obj.x = nx; obj.y = ny;
    obj.x = Math.max(r + 2, Math.min(CONFIG.width - r - 2, obj.x));
    obj.y = Math.max(r + 2, Math.min(CONFIG.height - r - 2, obj.y));
    return true;
  }

  // 2. X-only
  let canX = true;
  for (const w of walls) {
    if (circleRectCollision(obj.x + dx * sp, obj.y, r, w)) { canX = false; break; }
  }
  if (canX) {
    obj.x += dx * sp;
    obj.x = Math.max(r + 2, Math.min(CONFIG.width - r - 2, obj.x));
  }

  // 3. Y-only
  let canY = true;
  for (const w of walls) {
    if (circleRectCollision(obj.x, obj.y + dy * sp, r, w)) { canY = false; break; }
  }
  if (canY) {
    obj.y += dy * sp;
    obj.y = Math.max(r + 2, Math.min(CONFIG.height - r - 2, obj.y));
  }

  if (canX || canY) return true;

  // 4. Corner nudge ±30°
  const angle = Math.atan2(dy, dx);
  for (const offset of [0.52, -0.52]) {
    const a = angle + offset;
    const cx = obj.x + Math.cos(a) * sp;
    const cy = obj.y + Math.sin(a) * sp;
    let ok = true;
    for (const w of walls) {
      if (circleRectCollision(cx, cy, r, w)) { ok = false; break; }
    }
    if (ok) {
      obj.x = cx; obj.y = cy;
      obj.x = Math.max(r + 2, Math.min(CONFIG.width - r - 2, obj.x));
      obj.y = Math.max(r + 2, Math.min(CONFIG.height - r - 2, obj.y));
      return true;
    }
  }

  // 5. Perpendicular
  const perp1 = angle + Math.PI / 2;
  const perp2 = angle - Math.PI / 2;
  for (const a of [perp1, perp2]) {
    const cx = obj.x + Math.cos(a) * sp;
    const cy = obj.y + Math.sin(a) * sp;
    let ok = true;
    for (const w of walls) {
      if (circleRectCollision(cx, cy, r, w)) { ok = false; break; }
    }
    if (ok) {
      obj.x = cx; obj.y = cy;
      obj.x = Math.max(r + 2, Math.min(CONFIG.width - r - 2, obj.x));
      obj.y = Math.max(r + 2, Math.min(CONFIG.height - r - 2, obj.y));
      return true;
    }
  }

  return false;
}
