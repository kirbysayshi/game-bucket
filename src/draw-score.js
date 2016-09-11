import drawText from './draw-text';

export default function drawScore (interp, state) {
  const { SPRITE_ROWS } = state;
  drawText(state, '█ ' + state.money, 0.5, SPRITE_ROWS - 1);
}