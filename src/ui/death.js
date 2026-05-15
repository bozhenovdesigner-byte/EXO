import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { playLose } from '../audio/sfx.js';
import { showMessage, animateHeartLoss, updateLivesUI, restartLevel } from './screens.js';
import { generateLevel } from '../level/generator.js';
import { ctx, canvas } from '../renderer/canvas.js';

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
