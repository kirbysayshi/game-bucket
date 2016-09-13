import {
  FONT_COLOR_WHITE,
} from './constants';
import drawNamedTileAtColRow from './draw-named-tile-at-col-row';
import drawText from './draw-text';

export default function drawBootView (interp, state) {
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
  const titleScale = 3;
  drawText(state, 'Night-Shift', 1, 2, FONT_COLOR_WHITE, titleScale);
  drawText(state, 'Barista', 1, 3, FONT_COLOR_WHITE, titleScale);

  const leading = 0.5;
  let descRow = 6.5;

  drawText(state, 'You are the sole barista at a 24-hour coffee', 1, descRow += leading);
  drawText(state, 'shop. Serve your customers the glitching brew', 1, descRow += leading);
  drawText(state, 'their sleepless brains require.', 1, descRow += leading);

  let controlsRow = descRow + (3 * leading);
  drawText(state, 'CONTROLS:', 1, controlsRow += leading);
  drawText(state, 'UP: Move up', 1, controlsRow += leading);
  drawText(state, 'DOWN: Move down', 1, controlsRow += leading);
  drawText(state, 'RIGHT: Activate - Pick up - Put down', 1, controlsRow += leading);

  const creditsScale = 1;
  drawText(state, 'Programming & Design: Drew Petersen', 1, 14, FONT_COLOR_WHITE, creditsScale);
  drawText(state, 'Sprites: Lisa Leung', 1, 14.5, FONT_COLOR_WHITE, creditsScale);
  drawText(state, 'A 2016 JS13k Competition Entry', 1, 15, FONT_COLOR_WHITE, creditsScale);
}