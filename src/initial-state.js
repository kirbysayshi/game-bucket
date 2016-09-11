import Screen from '../lib/screen';
import { tetris, rngFloat } from '../lib/rng';
import imgColorShift from '../lib/img-color-shift';
import {
  ORDER_COUNTER,
  STEAMER,
  GROUPHEAD,
  GRINDER,
  HOT_WATER,
  TRASH,
  EMPTY_COUNTER,
  PICKUP_COUNTER,
  CUP_COUNTER,

  CLEAN_CUP,
  FILLED_CUP,
  CLEAN_PORTAFILTER,
  FILLED_PORTAFILTER,
  ATTACHED_PORTAFILTER,

  BARISTA,
  CHECKMARK,

} from './constants';

export default function initialState (cvs, tileImage, fontImage) {
  const SPRITE_SIZE = 12;
  const SPRITE_COLS = 9;
  const SPRITE_ROWS = 16;

  const tileMap = {
    [STEAMER]: { x: 0, y: 5 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [GROUPHEAD]: { x: 0, y: 4 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [HOT_WATER]: { x: 0, y: 3 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [GRINDER]: { x: 0, y: 7 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [CLEAN_CUP]: { x: 0, y: 9 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [FILLED_CUP]: { x: 0, y: 10 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [CLEAN_PORTAFILTER]: { x: 0, y: 12 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [FILLED_PORTAFILTER]: { x: 0, y: 11 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    //[ATTACHED_PORTAFILTER]: { x: 0, y: 8 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, }, // half
    [ORDER_COUNTER]: { x: 0, y: 0 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [PICKUP_COUNTER]: { x: 0, y: 8 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [BARISTA]: { x: 0, y: 13 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [CHECKMARK]: { x: 0, y: 99 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [TRASH]: { x: 0, y: 6 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [EMPTY_COUNTER]: { x: 0, y: 1 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [CUP_COUNTER]: { x: 0, y: 2 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
  };

  const fontChrOrder = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?&.\'-○✗❤★♪:█';
  const fontChrWidths = {
    2: 'ilI!.\':',
    3: 't1',
    4: 'abcdefghjknopqrsuvxyzL?-',
    5: 'ABCDEFGHJKNOPRSUZ023456789& █',
    6: 'mwMQTVWXY○✗❤★♪',
  }

  const fontImageBlack = imgColorShift(fontImage, 255, 0, 0, 255);

  const initial = {

    // Whether to show the debug state info
    debug: false,

    SPRITE_SIZE,
    SPRITE_COLS,
    SPRITE_ROWS,
    screen: Screen(cvs, SPRITE_SIZE * SPRITE_COLS, SPRITE_SIZE * SPRITE_ROWS, 2),

    tileImage,
    tileMap,

    fontImageWhite: fontImage,
    fontImageBlack,
    fontChrWidths,
    fontChrOrder,

    rng: rngFloat(tetris()),

    customers: [],
    orders: [],

    money: 0,

    stations: {
      offset: {
        cols: 2,
        rows: 0.5,
      },
      entries: [
        { type: ORDER_COUNTER, name: 'The Register', },
        { type: EMPTY_COUNTER, name: 'Counter', has: null, },
        { type: CUP_COUNTER, name: 'Cup Counter', },
        { type: HOT_WATER, name: 'Hot Water', has: null, },
        { type: GROUPHEAD, name: 'Grouphead', has: { type: CLEAN_PORTAFILTER, } },
        { type: STEAMER, name: 'Milk Steamer', has: null, /*has: { type: 'CLEAN_FROTHING_PITCHER' }*/ },
        { type: TRASH, name: 'Trash / Grounds Chute', },
        { type: GRINDER, name: 'Grinder', setting: 20, has: null }, // also tamps?
        { type: PICKUP_COUNTER, name: 'The Counter', has: [] },
      ],
    },
    player: {
      position: {
        cols: 0,
        rows: 0,
      },

      offset: {
        cols: 0,
        rows: 0.5,
      },

      // basically a limit to how the player can move.
      field: {
        cols: 1,
        rows: 8, // should match up with sum(stations heights - 1)
      },

      has: null,
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
    }
  };

  return initial;
}