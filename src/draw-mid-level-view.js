import {
  FONT_COLOR_WHITE,
} from './constants';
import drawNamedTileAtColRow from './draw-named-tile-at-col-row';
import drawText from './draw-text';

export default function drawMidLevelView (interp, state) {
  const {
    screen,
    tileSet,
    tileMap,
    SPRITE_COLS,
    SPRITE_ROWS,
    rareCustomers,
  } = state;

  screen.ctx.fillStyle = 'rgba(0,0,0,0.7)';
  screen.ctx.fillRect(0, 0, screen.width, screen.height);

  // state, str, col, row, color=FONT_COLOR_WHITE, scale=1
  const titleScale = 2;
  drawText(state, 'Shift Complete!', 1, 2, FONT_COLOR_WHITE, titleScale);

  let row = 4;
  if (rareCustomers.length) {
    drawText(state, 'Interesting people:', 1, row);
    rareCustomers.forEach((customer) => {
      drawText(state, customer.name, 1, row += 0.5);
    });
  }

  row++;

  drawText(state, 'The next night', 1, ++row, FONT_COLOR_WHITE, titleScale);
  drawText(state, '... Begins!', 1, ++row, FONT_COLOR_WHITE, titleScale);
}