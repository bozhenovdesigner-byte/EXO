import { state } from './state.js';
import { startGame } from './ui/screens.js';

export let pressedKeys = {};

export function initInput() {
  window.addEventListener('keydown', e => {
    pressedKeys[e.key] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    if (state.gameOver && state.lives <= 0) { state.initialized = false; startGame(); }
  });
  window.addEventListener('keyup', e => { pressedKeys[e.key] = false; });
}
