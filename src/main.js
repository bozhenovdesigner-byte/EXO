import { CONFIG } from './config.js';
import { state } from './state.js';
import { initInput, pressedKeys } from './input.js';
import { initAudio, audioCtx } from './audio/engine.js';
import { playAmbient } from './audio/ambient.js';
import { playEcho, playAlert, playHeartbeat, playTone } from './audio/sfx.js';
import { player } from './entities/player.js';
import { enemy, updateEnemy, isInEnemyVision } from './entities/enemy.js';
import { updateCards } from './entities/card.js';
import { updateFog } from './level/fog.js';
import { moveWithCollision } from './level/walls.js';
import { generateLevel, exit } from './level/generator.js';
import { draw } from './renderer/draw.js';
import { canvas, container, wrapper, holdBar, resizeCanvas, vignette, ctx } from './renderer/canvas.js';
import { updateLivesUI, updateLevelUI, showMessage, levelComplete, restartLevel } from './ui/screens.js';
import { runBootSequence } from './ui/boot.js';
import { handleDeath } from './ui/death.js';

function update() {
  if (!state.running || state.gameOver) return;
  const keys = pressedKeys;
  let dx = 0, dy = 0;
  player.breathHold = (keys['Shift'] || keys['ShiftLeft'] || keys['ShiftRight']);
  if (!player.breathHold) {
    if (keys['ArrowUp'] || keys['w'] || keys['W']) dy = -1;
    if (keys['ArrowDown'] || keys['s'] || keys['S']) dy = 1;
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) dx = -1;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) dx = 1;
  }
  if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }
  if ((dx !== 0 || dy !== 0) && !player.breathHold) {
    moveWithCollision(player, dx, dy, CONFIG.playerSpeed);
    state.silenceTimer = 0;
    if (Math.random() > 0.97) playTone(80 + Math.random() * 30, 0.02, 'sine', 0.01);
  } else state.silenceTimer++;
  if ((keys[' '] || keys['Spacebar']) && !player.breathHold && state.echoTimer === 0) triggerEcho();
  if (state.echoTimer > 0) state.echoTimer--;
  updateCards();
  updateEnemy();
  const pan = updateAtmosphere();
  updateFog(pan);
  if (exit.active && player.x > exit.x && player.x < exit.x + exit.w && player.y > exit.y && player.y < exit.y + exit.h) levelComplete();
}

function triggerEcho() {
  playEcho();
  state.echoTimer = CONFIG.echoDuration;
  enemy.investigate = { x: player.x + (Math.random() - 0.5) * 20, y: player.y + (Math.random() - 0.5) * 20, timer: 170 };
  enemy.alertPulse = 1;
  playAlert();
  showMessage("ОНА УСЛЫШАЛА...", 100);
}

function updateAtmosphere() {
  const d = Math.hypot(player.x - enemy.x, player.y - enemy.y);
  const prox = Math.max(0, 1 - d / 350);
  const vis = isInEnemyVision() ? 1 : 0;
  const pan = Math.max(prox, vis);
  const bpm = CONFIG.heartbeatBase + (CONFIG.heartbeatMax - CONFIG.heartbeatBase) * pan;
  const int = 60 / bpm * 60;
  if (!state.heartbeatTimer || state.heartbeatTimer <= 0) {
    playHeartbeat(pan);
    state.heartbeatTimer = int;
    state.screenPulse = 0.08 + pan * 0.12;
  }
  if (state.heartbeatTimer > 0) state.heartbeatTimer--;
  vignette.style.opacity = 0.5 + pan * 0.35;
  if (pan > 0.4 && Math.random() < 0.008 * pan) {
    ctx.fillStyle = `rgba(0,255,0,${0.05 + pan * 0.1})`;
    ctx.fillRect(Math.random() * CONFIG.width, Math.random() * CONFIG.height, CONFIG.width * 0.3, 1 + Math.random() * 3);
  }
  return pan;
}

function gameLoop() {
  update();
  draw();
  updateDebug();
  requestAnimationFrame(gameLoop);
}

// Debug panel
let debugPanelVisible = false;
const debugPanel = document.getElementById('debug-panel');

function updateDebug() {
  if (!debugPanelVisible) return;
  document.getElementById('dbg-enemy').textContent = `enemy: ${Math.round(enemy.x)},${Math.round(enemy.y)}`;
  document.getElementById('dbg-mode').textContent = `mode: ${enemy.investigate ? 'investigate' : 'patrol'}`;
  document.getElementById('dbg-wf').textContent = `wallFollow: ${enemy.wf.active ? `${enemy.wf.side.x},${enemy.wf.side.y}` : 'off'}`;
  document.getElementById('dbg-target').textContent = `target: ${enemy.investigate ? `${Math.round(enemy.investigate.x)},${Math.round(enemy.investigate.y)}` : '—'}`;
  document.getElementById('dbg-dist').textContent = `distToPlayer: ${Math.round(Math.hypot(player.x - enemy.x, player.y - enemy.y))}`;
  document.getElementById('dbg-stuck').textContent = `stuckFrames: ${enemy.stuckFrames}`;
}

window.addEventListener('keydown', e => {
  if (e.key === 'F2') {
    e.preventDefault();
    debugPanelVisible = !debugPanelVisible;
    debugPanel.style.display = debugPanelVisible ? 'block' : 'none';
  }
  if (e.key === 'F3') {
    e.preventDefault();
    if (enemy.investigate) enemy.investigate = null;
    enemy.wf.active = false;
    enemy.wf.wall = null;
  }
});


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
  updateLevelUI();
  state.running = true;
  state.gameOver = false;
  state.win = false;

  wrapper.style.display = 'none';
  container.style.display = 'block';

  document.getElementById('win-screen').classList.add('hidden');
  document.getElementById('lose-screen').classList.add('hidden');
  document.getElementById('level-screen').classList.add('hidden');

  canvas.classList.add('visible');
  for (const k in pressedKeys) delete pressedKeys[k];
  holdBar.style.display = 'none';
  resizeCanvas();
  if (audioCtx) setTimeout(playAmbient, 2000);
}

// Event listeners
initInput();

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-win').addEventListener('click', () => { state.initialized = false; startGame(); });
document.getElementById('restart-lose').addEventListener('click', () => { state.initialized = false; startGame(); });
document.getElementById('level-next-btn').addEventListener('click', () => {
  document.getElementById('level-screen').classList.add('hidden');
  restartLevel();
});
canvas.addEventListener('click', () => {
  if (state.gameOver && state.lives <= 0) { state.initialized = false; startGame(); }
});

window.addEventListener('resize', resizeCanvas);

updateLivesUI();
resizeCanvas();
runBootSequence();
gameLoop();
