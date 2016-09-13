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
  } = state;

  screen.ctx.fillStyle = 'rgba(0,0,0,0.7)';
  screen.ctx.fillRect(0, 0, screen.width, screen.height);

  // state, str, col, row, color=FONT_COLOR_WHITE, scale=1
  const titleScale = 2;
  drawText(state, 'Shift Complete!', 1, 2, FONT_COLOR_WHITE, titleScale);
  drawText(state, 'The next night', 1, 4, FONT_COLOR_WHITE, titleScale);
  drawText(state, '... Begins!', 1, 5, FONT_COLOR_WHITE, titleScale);
}