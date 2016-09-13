import drawText from './draw-text';
import { COLS_SPRITE_OFFSET } from './constants';

export default function drawScore (interp, state) {
  const { SPRITE_ROWS } = state;
  drawText(state, '█ ' + state.money, COLS_SPRITE_OFFSET, SPRITE_ROWS - 1 + 0.5);
  drawText(state, '❤ ' + state.reputation, COLS_SPRITE_OFFSET, SPRITE_ROWS - 2 + 0.5);

  const timeRemaining = state.levelMaxTime - state.levelTime;
  const remainingMinutes = Math.floor(timeRemaining / 60000);
  let remainingSeconds = Math.floor((timeRemaining - (remainingMinutes * 60000)) / 1000);
  remainingSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds;
  drawText(state, remainingMinutes + ':' + remainingSeconds, COLS_SPRITE_OFFSET, SPRITE_ROWS - 3 + 0.5);
}