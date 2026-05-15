import { CONFIG } from './config.js';
import { state } from './state.js';
import { canvas } from './renderer/canvas.js';
import { draw } from './renderer/draw.js';
import { player } from './entities/player.js';
import { enemy, isInEnemyVision } from './entities/enemy.js';
import { updateEnemy } from './entities/enemy.js';
import { cards, updateCards, holdBar } from './entities/card.js';
import { checkExit, exit } from './entities/exit.js';
import { walls, moveWithCollision } from './level/walls.js';
import { fogCells, smoothstep } from './level/fog.js';
import { generateLevel } from './level/generator.js';
import { initAudio, playTone } from './audio/engine.js';
import { playEcho, playAlert, playHeartbeat, playWin, playLevelUp, playLose } from './audio/sfx.js';
import { playAmbient } from './audio/ambient.js';
import { initInput, pressedKeys } from './input.js';
import { resizeCanvas } from './renderer/canvas.js';
import {
  updateLivesUI, updateLevelUI, showMessage,
  startGame, restartLevel, levelComplete, handleDeath
} from './ui/screens.js';
import { runBootSequence } from './ui/boot.js';

// ==================== ATMOSPHERE ====================
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
  const vignette = document.getElementById('vignette');
  vignette.style.opacity = 0.5 + pan * 0.35;
  if (pan > 0.4 && Math.random() < 0.008 * pan) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = `rgba(0,255,0,${0.05 + pan * 0.1})`;
    ctx.fillRect(Math.random() * CONFIG.width, Math.random() * CONFIG.height, CONFIG.width * 0.3, 1 + Math.random() * 3);
  }
  return pan;
}

// ==================== FOG UPDATE ====================
function updateFog(panic) {
  const targetR = state.echoTimer > 0 ? state.currentEchoRadius : CONFIG.fogBaseRadius;
  state.currentFogRadius += (targetR - state.currentFogRadius) * 0.15;
  const margin = state.currentFogRadius + CONFIG.fogFadeMargin + 10;
  const bx = player.x - margin, by = player.y - margin;
  const br = player.x + margin, bt = player.y + margin;
  const modMax = CONFIG.fogMaxAlpha + (Math.sin(Date.now() / 350) * 0.06 * panic);
  for (const c of fogCells) {
    c.alpha += (c.targetAlpha - c.alpha) * c.lerpSpeed;
    if (Math.abs(c.alpha - c.targetAlpha) < 0.01) {
      c.targetAlpha = CONFIG.fogMinAlpha + Math.random() * (modMax - CONFIG.fogMinAlpha);
      c.lerpSpeed = CONFIG.fogLerpBase + Math.random() * 0.004;
    }
    if (c.x > br || c.x + CONFIG.fogGridSize < bx || c.y > bt || c.y + CONFIG.fogGridSize < by) continue;
    const cx = c.x + CONFIG.fogGridSize / 2, cy = c.y + CONFIG.fogGridSize / 2;
    const d = Math.hypot(cx - player.x, cy - player.y);
    if (d < state.currentFogRadius) c.alpha = 0;
    else if (d < state.currentFogRadius + CONFIG.fogFadeMargin)
      c.alpha *= smoothstep(state.currentFogRadius, state.currentFogRadius + CONFIG.fogFadeMargin, d);
  }
}

// ==================== ECHO ====================
function triggerEcho() {
  playEcho();
  state.echoTimer = CONFIG.echoDuration;
  enemy.investigate = {
    x: player.x + (Math.random() - 0.5) * 20,
    y: player.y + (Math.random() - 0.5) * 20,
    timer: 170
  };
  enemy.alertPulse = 1;
  playAlert();
  showMessage("ОНА УСЛЫШАЛА...", 100);
}

// ==================== GAME UPDATE ====================
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

  updateCards(pressedKeys);
  const enemyResult = updateEnemy();
  if (enemyResult === 'death') { handleDeath(); return; }

  const pan = updateAtmosphere();
  updateFog(pan);

  if (checkExit()) levelComplete();
}

// ==================== GAME LOOP ====================
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// ==================== EVENT LISTENERS ====================
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

// ==================== INIT ====================
initInput();
updateLivesUI();
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
runBootSequence();
gameLoop();
