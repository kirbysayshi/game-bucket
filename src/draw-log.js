import { COLS_SPRITE_OFFSET, } from './constants';
import drawText from './draw-text';

export default function drawLog (interp, state) {
  const {
    log,
  } = state;

  let rows = 10.5;
  const logLineHeight = 0.5

  drawText(state, 'THOUGHTS', COLS_SPRITE_OFFSET, rows);

  log.forEach((txt, i) => {
    drawText(state, txt, COLS_SPRITE_OFFSET, rows += logLineHeight);
  });
}