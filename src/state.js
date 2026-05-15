import { CONFIG } from './config.js';

export const state = {
  running: false,
  cardsFound: 0,
  silenceTimer: 0,
  echoTimer: 0,
  gameOver: false,
  win: false,
  heartbeatTimer: 0,
  screenPulse: 0,
  holdingCard: null,
  svgLoaded: false,
  currentFogRadius: CONFIG.fogBaseRadius,
  currentLevel: 0,
  lives: CONFIG.maxLives,
  transitioning: false,
  currentEchoRadius: 90,
  isDead: false,
  initialized: false
};

export const svgAssets = { map: null, player: null, enemy: null, card: null };
export const svgPaths = { player: [], enemy: [], card: [] };
