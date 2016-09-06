import { rngFloat, tetris } from './lib/rng';
import loadImage from './lib/load-image';
import Screen from './lib/screen';
import {
  Entity,
  System,
  destroyEntity,
  systemPropReqs
} from './lib/ces';
import {
  schedule,
  tick,
} from './lib/time';
import { Loop } from './lib/loop';
import accelerate from 'pocket-physics/accelerate2d';
import inertia from 'pocket-physics/inertia2d';

loadImage('./assets/TGC22_Tiles4.png').then(img => init(img));

function init (img) {

  const smap = {
    img,
    tileWidth: 16,
    tileHeight: 16,
    cols: img.width / 16,
    drawIndex: (ctx, idx) => {

    },
    names: {
      'm.0': 8,
      'm.1': 20,
      'm.2': 124,
      'mech': 170,
    },
  };

  const random = rngFloat(tetris());

  const GRID_CELL_PX_WIDTH = 16;
  const GRID_COLS = 8;
  const GRID_ROWS = 10;

  const state = {
    GRID_COLS,
    GRID_ROWS,
    GRID_CELL_PX_WIDTH,
    cells: [],
    screen: Screen(window.c,
      GRID_CELL_PX_WIDTH * GRID_COLS,
      GRID_CELL_PX_WIDTH * GRID_ROWS),
    smap,
    random,
  };

  for (let i = 0; i < state.GRID_COLS * state.GRID_ROWS; i++) {
    const cells = state.cells;
    const r = random();
    const cell = {
      index: i,
      row: Math.floor(i / state.GRID_COLS),
      col: Math.floor(i % state.GRID_COLS),
    };

    cell.height = 0;

    if (r <= 0.4 && r > 0.2) {
      cell.height = random() > 0.5 ? 2 : 1;
    }

    if (r > 0 && r <= 0.2) {
      cell.hp = Math.floor(random() * 100);
    }

    cells.push(cell)
  }

  renderMap(state.GRID_COLS, state.GRID_CELL_PX_WIDTH, state.cells, state.screen, state.smap);

  const p1 = Entity({
    cpos: { x: 0, y: 0, },
    ppos: { x: 0, y: 0, },
    acel: { x: 10, y: 0, },
    tags: ['acel', 'inertia', ]
  });

  /*
    const map = state.cells.map((cell, i) => {
    let s = '';
    if (i % state.GRID_COLS === 0) s += '\n';
    s += '';
    if (cell.height == 2) s += 'O';
    if (cell.height == 1) s += 'o';
    if (cell.hp) s += '•';
    if (!cell.height && !cell.hp) s += ' ';
    s += '';
    return s;
  });

  console.log(map.join(''));
  */

  //document.addEventListener('keydown', )

  const turnEnergySys = System((entities, dt) => {
    entities.forEach(e => {
      
    });
  }, 'turn-energy');

  const acelSys = System((entities, dt) => {
    entities.forEach(e => accelerate(e, dt));
  }, 'acel');

  const inertiaSys = System((entities) => {
    entities.forEach(e => inertia(e));
  }, 'inertia');

  const dt = 16;

  acelSys(16);
  inertiaSys();
  console.log(p1.cpos);

  const loop = Loop({
    drawTime: 1000 / 60,
    updateTime: 1000 / 60,
    draw: (interpolation) => {},
    update: (dt) => {
      turnEnergySys();
    },
  })

  document.addEventListener('keydown', e => {
    if (e.which === 27) {
      loop.stop();
      console.log('HALT!')
    }
  }, false);
}

function renderMap (GRID_COLS, GRID_CELL_PX_WIDTH, cells, screen, smap) {

  const cellHeight = GRID_CELL_PX_WIDTH;

  cells.map((cell, i) => {
    const spriteIdx = smap.names['m.' + cell.height];
    const row = Math.floor(spriteIdx / smap.cols);
    const col = spriteIdx % smap.cols;

    const sx = col * smap.tileWidth;
    const sy = row * smap.tileHeight;

    const dx = cellHeight * (i % GRID_COLS);
    const dy = cellHeight * Math.floor(i / GRID_COLS);

    screen.ctx.drawImage(
      smap.img,
      sx, sy, smap.tileWidth, smap.tileHeight,
      dx, dy, cellHeight, cellHeight
    )
  });
}
