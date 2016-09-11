import { COUNTER_FLOOR, SHOP_FLOOR, DECORATIVE_PLANT, ROWS_SPRITE_OFFSET, } from './constants';
import drawNamedTileAtColRow from './draw-named-tile-at-col-row';

export default function drawFloorTiles (iterp, state) {

  // stations form a box, everything else is outside
  const { stations, screen, tileMap, SPRITE_COLS, SPRITE_ROWS, } = state;
  const colsMin = 0;
  const rowsMin = 0;
  const colsMax = stations.offset.cols;
  const rowsMax = stations.entries.length;

  // TODO: Should probably encode all of this into a true tile map.

  for (let i = 0; i < SPRITE_COLS; i++) {
    for (let j = 0; j < SPRITE_ROWS; j++) {

      if (i >= colsMin && i <= colsMax && j >= rowsMin && j <= rowsMax) {
        drawNamedTileAtColRow(state, COUNTER_FLOOR, i, j);
      } else {
        drawNamedTileAtColRow(state, SHOP_FLOOR, i, j);
      }
    }
  }

  for (let i = 0; i <= colsMax; i++) {
    drawNamedTileAtColRow(state, DECORATIVE_PLANT, i, rowsMax + ROWS_SPRITE_OFFSET);
  }
}