import drawNamedTileAtColRow from './draw-named-tile-at-col-row';
import { BARISTA } from './constants';

export default function drawPlayer (interp, state) {
  const {
    player,
  } = state;

  const { offset } = player;
  const { cols, rows } = player.position;

  const drawCols = offset.cols + cols;
  const drawRows = offset.rows + rows;

  if (player.has) {
    drawNamedTileAtColRow(state, player.has.type, drawCols + 0.5, drawRows);
  }

  drawNamedTileAtColRow(state, BARISTA, drawCols, drawRows);
}