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

  COUNTER_FLOOR,
  SHOP_FLOOR,
  DECORATIVE_PLANT,
  SHOP_DOOR,
  SHOP_WINDOW,

  CLEAN_CUP,
  FILLED_AMERICANO_CUP,
  FILLED_CAPPUCCINO_CUP,
  FILLED_ESPRESSO_CUP,
  CLEAN_PORTAFILTER,
  FILLED_PORTAFILTER,
  ATTACHED_PORTAFILTER,

  BARISTA,
  CHECKMARK,

  ROWS_SPRITE_OFFSET,
  GAME_UPDATE_DT,

} from './constants';

export default function initialLevelState (cvs, tileImage, fontImage) {
  const SPRITE_SIZE = 12;
  const SPRITE_COLS = 9;
  const SPRITE_ROWS = 16;

  const tileSet = {
    [STEAMER]: { x: 0, y: 5 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [GROUPHEAD]: { x: 0, y: 4 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [HOT_WATER]: { x: 0, y: 3 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [GRINDER]: { x: 0, y: 7 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [CLEAN_CUP]: { x: 0, y: 9 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [FILLED_AMERICANO_CUP]: { x: 0, y: 10 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [FILLED_CAPPUCCINO_CUP]: { x: 0, y: 11 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [FILLED_ESPRESSO_CUP]: { x: 0, y: 12 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [CLEAN_PORTAFILTER]: { x: 0, y: 14 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [FILLED_PORTAFILTER]: { x: 0, y: 13 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    //[ATTACHED_PORTAFILTER]: { x: 0, y: 8 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, }, // half
    [ORDER_COUNTER]: { x: 0, y: 0 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [PICKUP_COUNTER]: { x: 0, y: 8 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [BARISTA]: { x: 0, y: 15 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [CHECKMARK]: { x: 0, y: 99 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [TRASH]: { x: 0, y: 6 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [EMPTY_COUNTER]: { x: 0, y: 1 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [CUP_COUNTER]: { x: 0, y: 2 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [COUNTER_FLOOR]: { x: 0, y: 20 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [SHOP_FLOOR]: { x: 0, y: 19 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [DECORATIVE_PLANT]: { x: 0, y: 18 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [SHOP_DOOR]: { x: 0, y: 16 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
    [SHOP_WINDOW]: { x: 0, y: 17 * SPRITE_SIZE, w: SPRITE_SIZE, h: SPRITE_SIZE, },
  };

  // These ranges are inclusive.
  // Rects are drawn in iteration order, which is likely definition order...
  const tileMap = {
    '0,0-2,8': COUNTER_FLOOR,
    '3,0-8,9': SHOP_FLOOR,
    '0,9-15,15': SHOP_FLOOR,
    '8,0-8,1': SHOP_DOOR,
    '8,4': SHOP_WINDOW,
    '8,6': SHOP_WINDOW,
    '8,8': SHOP_WINDOW,
    '8,10': SHOP_WINDOW,
    '0,9-2,9': DECORATIVE_PLANT,
  };

  const fontChrOrder = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?&.\'-○✗❤★♪:█,';
  const fontChrWidths = {
    2: 'ilI!.\':,',
    3: 't1',
    4: 'abcdefghjknopqrsuvxyzL?-',
    5: 'ABCDEFGHJKNOPRSUZ023456789& █',
    6: 'mwMQTVWXY○✗❤★♪',
  }

  const fontImageBlack = imgColorShift(fontImage, 255, 0, 0, 255);

  const initial = {

    // Whether to show the debug state info
    debug: false,

    view: 'BOOT_GAME_VIEW', //'LEVEL_VIEW',

    SPRITE_SIZE,
    SPRITE_COLS,
    SPRITE_ROWS,
    screen: Screen(cvs, SPRITE_SIZE * SPRITE_COLS, SPRITE_SIZE * SPRITE_ROWS, 2),

    tileImage,
    tileSet,
    tileMap,

    fontImage,
    fontImageWhite: fontImage,
    fontImageBlack,
    fontChrWidths,
    fontChrOrder,

    rng: rngFloat(tetris()),

    customers: [],
    orders: [],

    money: 0,
    reputation: 0,

    levelTime: 0,
    levelMaxTime: GAME_UPDATE_DT * 10 * 10, //600,

    sun: {
      position: { start: 0, end: 0, },
      height: { start: 0, end: 0, },
      distance: { start: 0, end: 0 },
    },

    stations: {
      offset: {
        cols: 2,
        rows: ROWS_SPRITE_OFFSET,
      },
      entries: [
        { type: ORDER_COUNTER, name: 'The Register', },
        { type: EMPTY_COUNTER, name: 'Counter', has: [], },
        { type: CUP_COUNTER, name: 'Cup Counter', },
        { type: HOT_WATER, name: 'Hot Water', has: [], timer: { value: 0, max: 10, hold: true, active: false, green: 1, red: 1, } },
        { type: GROUPHEAD, name: 'Grouphead', has: [{ type: CLEAN_PORTAFILTER, }], timer: { value: 0, max: 30, hold: false, active: false, green: 0.55, red: 0.95, } },
        { type: STEAMER, name: 'Milk Steamer', has: [], timer: { value: 0, max: 30, hold: true, active: false, green: 0.55, red: 0.95, } },
        { type: TRASH, name: 'Trash / Grounds Chute', },
        { type: GRINDER, name: 'Grinder', setting: 20, has: [], timer: { value: 0, max: 10, hold: true, active: false, green: 1, red: 1, }, }, // also tamps?
        { type: PICKUP_COUNTER, name: 'The Counter', has: [] },
      ],
    },
    player: {

      isActivating: false,

      position: {
        cols: 0,
        rows: 0,
      },

      offset: {
        cols: 0,
        rows: ROWS_SPRITE_OFFSET,
      },

      // basically a limit to how the player can move.
      field: {
        cols: 1,
        rows: 8, // should match up with sum(stations heights - 1)
      },

      has: [],
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

  initial.sun.position.start = initial.screen.height * 2;
  initial.sun.position.end = -initial.screen.height / 3;
  initial.sun.distance.start = initial.sun.distance.end = initial.screen.width / 2;
  initial.sun.height.start = initial.screen.height / 2;
  initial.sun.height.end = initial.screen.height * 3;

  return initial;
}