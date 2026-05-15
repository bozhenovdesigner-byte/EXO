import { CONFIG } from '../config.js';
import { player } from './player.js';

export const exit = { x: 755, y: 275, w: 25, h: 50, active: false };

export function checkExit() {
  return exit.active &&
    player.x > exit.x && player.x < exit.x + exit.w &&
    player.y > exit.y && player.y < exit.y + exit.h;
}
