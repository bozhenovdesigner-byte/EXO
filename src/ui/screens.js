import { CONFIG, LEVELS } from '../config.js';
import { state } from '../state.js';
import { canvas, container, wrapper } from '../renderer/canvas.js';
import { playWin, playLevelUp } from '../audio/sfx.js';
import { generateLevel } from '../level/generator.js';

export function updateLivesUI() {
  const livesEl = document.getElementById('lives');
  let hearts = '';
  for (let i = 0; i < CONFIG.maxLives; i++) hearts += i < state.lives ? '♥' : '♡';
  livesEl.textContent = hearts;
  livesEl.style.color = state.lives === 1 ? '#f00' : (state.lives === 2 ? '#f66' : '#0f0');
}

export function animateHeartLoss() {
  const livesEl = document.getElementById('lives');
  livesEl.classList.add('heart-lost');
  setTimeout(() => livesEl.classList.remove('heart-lost'), 400);
}

export function updateLevelUI() {
  const level = LEVELS[state.currentLevel];
  document.getElementById('level-indicator').textContent = `УРОВЕНЬ ${state.currentLevel + 1}: ${level.name}`;
  document.getElementById('cards-total').textContent = level.cards;
}

export function showMessage(t, d) {
  const e = document.getElementById('message');
  e.textContent = t;
  e.classList.add('show');
  setTimeout(() => e.classList.remove('show'), d);
}

export function levelComplete() {
  if (state.transitioning || state.isDead) return;
  state.transitioning = true;
  state.running = false;
  playLevelUp();

  if (state.currentLevel < LEVELS.length - 1) {
    state.currentLevel++;
    setTimeout(() => {
      const level = LEVELS[state.currentLevel];
      document.getElementById('level-title').textContent = `УРОВЕНЬ ${state.currentLevel + 1}`;
      document.getElementById('level-desc').textContent = level.desc;
      document.getElementById('level-screen').classList.remove('hidden');
    }, 500);
  } else {
    setTimeout(() => { playWin(); document.getElementById('win-screen').classList.remove('hidden'); }, 500);
  }
}

export function restartLevel() {
  state.transitioning = false;
  state.isDead = false;
  generateLevel();
  updateLevelUI();
  state.running = true;
  state.gameOver = false;
}
