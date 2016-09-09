export default function drawStations (interp, state) {
  const {
    screen,
    stations,
    SPRITE_SIZE,
  } = state;

  const { offset, entries } = stations;
  const col = offset.cols;
  let rowsTotal = offset.rows;

  entries.forEach((station, idx) => {
    const row = rowsTotal;
    const red = idx % 2 === 0 ? 255 : 25;
    const blue = Math.floor((idx / entries.length) * 255);
    screen.ctx.fillStyle = 'rgba(' + red + ',50,' + blue + ',1)';
    screen.ctx.fillRect(
      col * SPRITE_SIZE,
      row * SPRITE_SIZE,
      SPRITE_SIZE, station.wh.rows * SPRITE_SIZE
    );
    rowsTotal += station.wh.rows;
  });
}