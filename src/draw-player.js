import drawNamedTileAtColRow from './draw-named-tile-at-col-row';
import { BARISTA } from './constants';

export default function drawPlayer (interp, state) {
  const {
    player,
  } = state;

  const { offset } = player;
  const { cols, rows } = player.position;

  drawNamedTileAtColRow(state, BARISTA, offset.cols + cols, offset.rows + rows);
}