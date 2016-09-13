import {
  FONT_COLOR_WHITE,
} from './constants';
import drawNamedTileAtColRow from './draw-named-tile-at-col-row';
import drawText from './draw-text';

export default function drawSummaryView (interp, state) {
  const {
    screen,
    tileSet,
    tileMap,
    SPRITE_COLS,
    SPRITE_ROWS,
  } = state;

  screen.ctx.fillStyle = 'rgba(0,0,0,0.7)';
  screen.ctx.fillRect(0, 0, screen.width, screen.height);

  // state, str, col, row, color=FONT_COLOR_WHITE, scale=1
  const titleScale = 2;
  drawText(state, 'Weekly', 1, 2, FONT_COLOR_WHITE, titleScale);
  drawText(state, 'Night-Shifts:', 1, 3, FONT_COLOR_WHITE, titleScale);
  drawText(state, 'Complete!', 1, 4, FONT_COLOR_WHITE, titleScale);

  const leading = 0.5;
  let rows = 4.5;

  drawText(state, '❤: ' + state.reputation, 1, rows += leading);
  drawText(state, '█: ' + state.money , 1, rows += leading);
  drawText(state, 'Customers: ' + state.totalCustomersServed, 1, rows += leading);

  const creditsScale = 1;
  drawText(state, 'Thank you for playing!', 1, rows += leading, FONT_COLOR_WHITE, creditsScale);
}