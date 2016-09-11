import drawNamedTileAtColRow from './draw-named-tile-at-col-row';
import { BARISTA } from './constants';

export default function drawPlayer (interp, state) {
  const {
    screen,
    player,
    SPRITE_SIZE,
  } = state;

  const { offset } = player;
  const { cols, rows } = player.position;

  const tile = state.tileMap[BARISTA];
  screen.ctx.drawImage(state.tileImage,
    tile.x, tile.y, tile.w, tile.h,
    (offset.cols + cols) * SPRITE_SIZE, (offset.rows + rows) * SPRITE_SIZE,
    SPRITE_SIZE, SPRITE_SIZE
  );
}