import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { player } from './player.js';
import { playTone } from '../audio/engine.js';
import { playCardCollect } from '../audio/sfx.js';
import { showMessage } from '../ui/screens.js';

export let cards = [];
export const holdBar = document.querySelector('.hold-bar');
export const holdFill = document.getElementById('hold-fill');

export function updateCards(pressedKeys) {
  for (const card of cards) {
    if (card.collected) continue;
    const d = Math.hypot(player.x - card.x, player.y - card.y);
    const vis = state.echoTimer > 0 && d < state.currentEchoRadius + 20;
    if (vis && d < player.radius + card.radius + 8) {
      if ((pressedKeys[' '] || pressedKeys['Spacebar']) && !player.breathHold) {
        holdBar.style.display = 'block'; state.holdingCard = card;
        card.holdProgress = Math.min(CONFIG.cardHoldTime, card.holdProgress + 1);
        holdFill.style.width = (card.holdProgress / CONFIG.cardHoldTime * 100) + '%';
        if (card.holdProgress % 8 === 0) playTone(420, 0.02, 'sine', 0.015);
        if (card.holdProgress >= CONFIG.cardHoldTime) {
          card.collected = true; state.cardsFound++; state.holdingCard = null;
          holdBar.style.display = 'none'; playCardCollect();
          document.getElementById('cards').textContent = state.cardsFound;
          const level = CONFIG.LEVELS?.[state.currentLevel];
          if (state.cardsFound === (level?.cards || 3)) {
            // exit активируется в generator
            showMessage("✓ ДВЕРЬ ОТКРЫТА", 200);
            playTone(1100, 0.15, 'sine', 0.1);
          }
        }
      } else {
        if (!player.breathHold) card.holdProgress = Math.max(0, card.holdProgress - 2);
        holdFill.style.width = (card.holdProgress / CONFIG.cardHoldTime * 100) + '%';
        if (card.holdProgress === 0) holdBar.style.display = 'none';
      }
    } else {
      if (card.holdProgress > 0) {
        card.holdProgress = Math.max(0, card.holdProgress - 3);
        holdFill.style.width = (card.holdProgress / CONFIG.cardHoldTime * 100) + '%';
        if (card.holdProgress === 0) holdBar.style.display = 'none';
      }
      if (state.holdingCard === card) state.holdingCard = null;
    }
  }
}
