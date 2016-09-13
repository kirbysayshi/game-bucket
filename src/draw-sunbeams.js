import {
  SHOP_WINDOW,
  SHOP_DOOR,
} from './constants';

export default function drawSunbeams (interp, state) {

  const {
    SPRITE_COLS,
    SPRITE_ROWS,
    tileMap,
    sun,
    screen,
  } = state;
  const pct = state.levelTime / state.levelMaxTime;

  const sunX = -1 * sun.distance.start;
  const sunY = sun.position.start + ((sun.position.end - sun.position.start) * pct);
  const height = sun.height.start + ((sun.height.end - sun.height.start) * pct);
  const halfHeight = height / 2;

  const coords = Object.keys(tileMap).filter(k =>
    tileMap[k] === SHOP_WINDOW || tileMap[k] === SHOP_DOOR);
  const re = /(\d+),(\d+)/;

  const colsWidth = screen.width / SPRITE_COLS;
  const rowsHeight = screen.height / SPRITE_ROWS;

  screen.ctx.save();
  screen.ctx.globalCompositeOperation = 'overlay'; //'lighter';

  for (let i = 0; i < coords.length; i++) {

    const coord = coords[i];

    // Handle ranges... sort of.
    if (coord.indexOf('-') > -1) {
      const [ , tail, ] = coord.split('-');
      coords.push(tail);
    }

    let [ , cols, rows, ] = re.exec(coord);

    cols = parseInt(cols, 10);
    rows = parseInt(rows, 10);

    screen.ctx.fillStyle = 'rgba(255, 255, 255, ' + (pct * 0.2) + ')';
    screen.ctx.beginPath();
    screen.ctx.moveTo((cols + 1) * colsWidth, rows * rowsHeight);
    screen.ctx.lineTo(sunX, sunY - halfHeight);
    screen.ctx.lineTo(sunX, sunY + halfHeight);
    screen.ctx.lineTo((cols + 1) * colsWidth, (rows + 1) * rowsHeight);
    screen.ctx.fill();
  }

  screen.ctx.restore();
}