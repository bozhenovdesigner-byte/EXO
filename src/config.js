export const LEVELS = [
  { cards: 3, enemySpeed: 1.8, patrolRadius: 320, echoRadius: 90, name: "БУНКЕР", desc: "3 ключа • Стандарт" },
  { cards: 4, enemySpeed: 1.9, patrolRadius: 380, echoRadius: 80, name: "ЛАБИРИНТ", desc: "4 ключа • ОНА злее" },
  { cards: 5, enemySpeed: 2.0, patrolRadius: 420, echoRadius: 70, name: "БЕЗДНА", desc: "5 ключей • ОНА злее" }
];

export const CONFIG = {
  width: 800, height: 600,
  playerSpeed: 2.2, enemyPatrolSpeed: 1.1, enemyChaseSpeed: 2.0,
  echoDuration: 48,
  enemyVisionRange: 190, enemyVisionAngle: 110,
  cardHoldTime: 55, silenceThreshold: 120,
  heartbeatBase: 50, heartbeatMax: 200, gridSize: 40,
  fogGridSize: 30, fogBaseRadius: 120, fogFadeMargin: 40,
  fogMinAlpha: 0.92, fogMaxAlpha: 0.85, fogLerpBase: 0.004,
  maxLives: 3
};
