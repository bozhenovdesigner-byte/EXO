import { CONFIG, LEVELS } from '../config.js';
import { state } from '../state.js';
import { canvas, container, wrapper } from '../renderer/canvas.js';
import { player } from '../entities/player.js';
import { enemy } from '../entities/enemy.js';
import { generateLevel } from '../level/generator.js';
import { initAudio, playTone } from '../audio/engine.js';
import { playAmbient } from '../audio/ambient.js';
import { playWin, playLevelUp, playLose } from '../audio/sfx.js';
import { pressedKeys } from '../input.js';

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

export function startGame() {
  if (state.initialized) return;
  state.initialized = true;

  initAudio();
  state.currentLevel = 0;
  state.lives = CONFIG.maxLives;
  state.transitioning = false;
  state.isDead = false;
  updateLivesUI();
  generateLevel();
  state.running = true;
  state.gameOver = false;
  state.win = false;

  wrapper.style.display = 'none';
  container.style.display = 'block';

  document.getElementById('win-screen').classList.add('hidden');
  document.getElementById('lose-screen').classList.add('hidden');
  document.getElementById('level-screen').classList.add('hidden');

  canvas.classList.add('visible');
  Object.keys(pressedKeys).forEach(k => pressedKeys[k] = false);
  document.querySelector('.hold-bar').style.display = 'none';

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx) setTimeout(playAmbient, 2000);
}

export function restartLevel() {
  state.transitioning = false;
  state.isDead = false;
  generateLevel();
  state.running = true;
  state.gameOver = false;
  Object.keys(pressedKeys).forEach(k => pressedKeys[k] = false);
  document.querySelector('.hold-bar').style.display = 'none';
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

export function handleDeath() {
  if (state.isDead) return;
  state.isDead = true;
  state.lives--;
  animateHeartLoss();
  updateLivesUI();

  if (state.lives <= 0) {
    state.running = false; state.gameOver = true; state.win = false;
    playLose();
    document.getElementById('death-message').textContent = 'Все жизни потеряны. Она победила.';
    const ctx = canvas.getContext('2d');
    setTimeout(() => {
      ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
      ctx.fillStyle = '#f00'; ctx.font = 'bold 24px monospace'; ctx.textAlign = 'center';
      ctx.fillText('КОНЕЦ', CONFIG.width / 2, CONFIG.height / 2);
      ctx.font = '14px monospace'; ctx.fillStyle = '#0f0';
      ctx.fillText('нажми для рестарта', CONFIG.width / 2, CONFIG.height / 2 + 30);
    }, 800);
    document.getElementById('lose-screen').classList.remove('hidden');
  } else {
    playLose();
    showMessage(`♥ Осталось жизней: ${state.lives}`, 1500);
    state.running = false;
    setTimeout(() => {
      state.isDead = false;
      generateLevel();
      state.running = true;
      state.gameOver = false;
    }, 1000);
  }
}
