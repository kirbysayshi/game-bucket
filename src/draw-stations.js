import { PICKUP_COUNTER } from './constants';
import drawNamedTileAtColRow from './draw-named-tile-at-col-row';

export default function drawStations (interp, state) {
  const {
    stations,
  } = state;

  const { offset, entries } = stations;
  const col = offset.cols;
  let rowsTotal = offset.rows;

  entries.forEach((station, idx) => {
    const row = rowsTotal;

    // TODO: should the ORDER_COUNTER station be two spaces?
    // Could do ORDER_COUNTER_1 ORDER_COUNTER_2 instead of special case?

    drawNamedTileAtColRow(state, station.type, col, row);

    if (station.has && station.type !== PICKUP_COUNTER) {
      drawNamedTileAtColRow(state, station.has.type, col - 1, row);
    }

    if (station.type === PICKUP_COUNTER) {
      station.has.forEach(thing => {
        // TODO: how to display multiple things on the counter?
        drawNamedTileAtColRow(state, thing.type, col - 1, row);
      });
    }

    rowsTotal += station.wh.rows;
  });
}