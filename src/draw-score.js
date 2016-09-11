import drawText from './draw-text';
import { COLS_SPRITE_OFFSET } from './constants';

export default function drawScore (interp, state) {
  const { SPRITE_ROWS } = state;
  drawText(state, '█ ' + state.money, COLS_SPRITE_OFFSET, SPRITE_ROWS - 1);
}