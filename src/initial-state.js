import Screen from '../lib/screen';
import { tetris, rngFloat } from '../lib/rng';

export default function initialState (cvs, sheet) {
  const SPRITE_SIZE = 12;
  const SPRITE_COLS = 9;
  const SPRITE_ROWS = 16;

  const initial = {
    SPRITE_SIZE,
    SPRITE_COLS,
    SPRITE_ROWS,
    screen: Screen(cvs, SPRITE_SIZE * SPRITE_COLS, SPRITE_SIZE * SPRITE_ROWS),
    sheet,
    rng: rngFloat(tetris()),

    customers: [],
    orders: [],
    stations: {
      offset: {
        cols: 2,
        rows: 0,
      },
      entries: [
        { type: 'ORDER_COUNTER', name: 'The Register', wh: { cols: 1, rows: 2, }, },
        { type: 'STEAMER', name: 'Milk Steamer', wh: { cols: 1, rows: 1, }, has: { type: 'CLEAN_FROTHING_PITCHER' } },
        { type: 'GROUPHEAD', name: 'Grouphead', wh: { cols: 1, rows: 1, }, has: { type: 'CLEAN_PORTAFILTER' } },
        { type: 'GROUPHEAD', name: 'Grouphead', wh: { cols: 1, rows: 1, }, has: { type: 'CLEAN_PORTAFILTER' } },
        { type: 'STEAMER', name: 'Milk Steamer', wh: { cols: 1, rows: 1, }, has: { type: 'CLEAN_FROTHING_PITCHER' } },
        { type: 'GRINDER', name: 'Grinder', wh: { cols: 1, rows: 1, }, setting: 20 }, // also tamps?
        { type: 'HOT_WATER', name: 'Hot Water', wh: { cols: 1, rows: 1, }, },
        { type: 'TRASH', name: 'Trash / Grounds Chute', wh: { cols: 1, rows: 1, }, },
        { type: 'EMPTY_COUNTER', name: 'Counter', wh: { cols: 1, rows: 1, }, has: null, },
        { type: 'PICKUP_COUNTER', name: 'The Counter', wh: { cols: 1, rows: 1, }, has: [] },
      ],
    },
    player: {
      position: {
        cols: 0,
        rows: 0,
      },

      offset: {
        cols: 0,
        rows: 0,
      },

      // basically a limit to how the player can move.
      field: {
        cols: 1,
        rows: 10, // should match up with sum(stations heights)
      },

      has: [
      // { type: 'DIRTY_PORTAFILTER' }
      // { type: 'DIRTY_FROTHING_PITCHER' }
      // { type: 'CLEAN_FROTHING_PITCHER' }
      // { type: 'DIRTY_CUP' }
      // { type: 'EMPTY_CUP' }
      // { type: 'CAPPUCCINO', milkFroth: 50, milkTemp: 140-150F, espressoPull: 27, espressoTemp: 199, BAR: 9, tamp: 6 }
      // { type: 'CAFFE_LATTE', values? }
      // { type: 'MACCHIATTO', values? }
      // { type: 'AMERICANO', values? }
      // tamped: how much time was spent tamping / pressure
      // grounds: how finely ground the grounds are
      // { type: 'FILLED_PORTAFILTER', tamped: 20, grounds: 50 },
      // { type: 'CLEAN_PORTAFILTER' }
      ]
    }
  };

  return initial;
}