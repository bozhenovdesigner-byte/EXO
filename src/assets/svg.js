import { svgAssets, svgPaths, state } from '../state.js';

export async function loadSVG(src) {
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 2000);
    const r = await fetch(src, { signal: ctrl.signal });
    clearTimeout(tid);
    if (!r.ok) return null;
    const doc = new DOMParser().parseFromString(await r.text(), 'image/svg+xml');
    return doc.querySelector('parsererror') ? null : doc;
  } catch { return null; }
}

export function extractPaths(doc, cls) {
  if (!doc) return [];
  return Array.from(doc.querySelectorAll(`.${cls}`)).map(el => {
    const t = el.tagName.toLowerCase(), p = {};
    if (t === 'rect') {
      p.type = 'rect';
      p.x = +el.getAttribute('x') || 0;
      p.y = +el.getAttribute('y') || 0;
      p.w = +el.getAttribute('width') || 0;
      p.h = +el.getAttribute('height') || 0;
    } else if (t === 'circle') {
      p.type = 'circle';
      p.cx = +el.getAttribute('cx') || 0;
      p.cy = +el.getAttribute('cy') || 0;
      p.r = +el.getAttribute('r') || 0;
    }
    p.fill = el.getAttribute('fill');
    p.stroke = el.getAttribute('stroke');
    return p;
  });
}

export async function loadAllSVGs() {
  const [m, p, e, c] = await Promise.all([
    loadSVG('map.svg').catch(() => null),
    loadSVG('player.svg').catch(() => null),
    loadSVG('enemy.svg').catch(() => null),
    loadSVG('card.svg').catch(() => null)
  ]);
  let loaded = [];
  if (m) { svgAssets.map = m; loaded.push('карта'); }
  if (p) { svgAssets.player = p; svgPaths.player = extractPaths(p, 'player'); loaded.push('игрок'); }
  if (e) { svgAssets.enemy = e; svgPaths.enemy = extractPaths(e, 'enemy'); loaded.push('враг'); }
  if (c) { svgAssets.card = c; svgPaths.card = extractPaths(c, 'card'); loaded.push('артефакт'); }
  state.svgLoaded = loaded.length > 0;
  return loaded;
}
