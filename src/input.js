export const pressedKeys = {};

export function initInput() {
  window.addEventListener('keydown', e => {
    pressedKeys[e.key] = true;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  });
  window.addEventListener('keyup', e => {
    pressedKeys[e.key] = false;
  });
}
