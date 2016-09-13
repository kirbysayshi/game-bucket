import {
  COUNTER_FLOOR,
  SHOP_FLOOR,
  DECORATIVE_PLANT,
  ROWS_SPRITE_OFFSET,
} from './constants';
import drawNamedTileAtColRow from './draw-named-tile-at-col-row';

export default function drawFloorTiles (iterp, state) {

  // stations form a box, everything else is outside
  const { stations, screen, tileSet, tileMap, SPRITE_COLS, SPRITE_ROWS, } = state;
  const colsMin = 0;
  const rowsMin = 0;
  const colsMax = stations.offset.cols;
  const rowsMax = stations.entries.length;

  // decode tile map
  const coords = Object.keys(tileMap);
  for (let i = 0; i < coords.length; i++) {
    let range = coords[i];
    const tileKey = range;

    // Single tiles are just ranges.
    if (range.indexOf('-') === -1) range = range + '-' + range;

    const rangeRe = /(\d+),(\d+)-(\d+),(\d+)/g;
    let rangeMatch = rangeRe.exec(range);

    let [, startCols, startRows, endCols, endRows ] = rangeMatch;

    startCols = parseInt(startCols, 10);
    startRows = parseInt(startRows, 10);
    endCols = parseInt(endCols, 10);
    endRows = parseInt(endRows, 10);

    for (let i = startCols; i <= endCols; i++) {
      for (let j = startRows; j <= endRows; j++) {
        drawNamedTileAtColRow(state, tileMap[tileKey], i, j);
      }
    }
  };
}