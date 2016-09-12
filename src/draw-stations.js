import drawNamedTileAtColRow from './draw-named-tile-at-col-row';
import drawProgressAtColRow from './draw-progress-at-col-row';

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

    if (station.has) {
      for (let i = 0; i < station.has.length; i++) {
        drawNamedTileAtColRow(state, station.has[i].type, col - 1, row);
      }
    }

    if (station.timer && station.timer.value > 0) {
      drawProgressAtColRow(state, station.timer.value, station.timer.max, col, row, station.timer.green, station.timer.red);
    }

    rowsTotal += 1;
  });
}