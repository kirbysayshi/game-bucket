import Screen from './lib/screen';

// Espresso: the coffee beverage produced by a pump or lever espresso machine. This Italian word describes a beverage made from 7 grams (+/- 2 grams) of finely ground coffee, producing 1-1.5 ounces (30-45ml) of extracted beverage under 9 bar (135psi) of brewing pressure at brewing temperatures of between 194 and 204 degrees Fahrenheit, over a period of 25 seconds (+/- 5 seconds) of brew time. Espresso is what this whole definition list is about!

function tetris () {
  var value = 0x8988;
  return function() {
    var bit1 = (value >> 1) & 1;
    var bit9 = (value >> 9) & 1;
    var leftmostBit = bit1 ^ bit9;
    return (value = ((leftmostBit << 15) | (value >>> 1)) >>> 0);
  }
}

function rngFloat (rng) {
  return () => {
    return (rng() - 2) / 65534;
  }
}

// naivedux! https://github.com/jomaxx/naivedux
function Store(reducer, initialState) {
  let state = initialState;
  let listeners = [];

  this.getState = () => state;

  this.dispatch = (action) => {
    if (typeof action === 'function') return action(this.dispatch, this.getState);
    state = reducer(state, action);
    listeners.forEach(listener => listener());
    return action;
  };

  this.subscribe = (fn) => {
    listeners.push(fn);

    return () => {
      listeners = listeners.filter(listener => listener !== fn);
    };
  };

  this.dispatch({ type: '@@INIT'});
}

function reducer (state, action) {
  
  // TODO: figure out some sort of immutability helper. maybe just ... ?

  if (action.type === 'NEW_CUSTOMER') {
    state.customers.push({
      name: action.data.name,
      wants: action.data.wants,
    });
  }
  
  if (action.type === 'SWIPE_UP') {
    const row = state.player.position.rows -= 1;
    if (row < 0) {
      state.player.position.rows = 0;
    }
  }
  
  if (action.type === 'SWIPE_DOWN') {
    const row = state.player.position.rows += 1;
    if (row > state.player.field.rows) {
      state.player.position.rows = state.player.field.rows;
    }
  }
  
  return state;
}


const SPRITE_SIZE = 24;
const SPRITE_COLS = 9;
const SPRITE_ROWS = 16;

const INITIAL_STATE = {
  SPRITE_SIZE,
  SPRITE_COLS,
  SPRITE_ROWS,
  screen: Screen(window.c, SPRITE_SIZE * SPRITE_COLS, SPRITE_SIZE * SPRITE_ROWS),
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

const store = new Store(reducer, INITIAL_STATE);

store.subscribe(() => {
  let debug = window.d;
  if (!debug) {
    debug = document.createElement('pre');
    debug.id = 'd';
    debug.style = 'display:block;position:absolute;color:white;overflow:scroll;z-index:9000;height:100%;width:100%;top:0;left:0';
    document.body.appendChild(debug);
  }

  // eventually only do this if a key is pressed
  debug.innerHTML = JSON.stringify(store.getState(), null, '  ');

  render(1, store.getState());
});

document.body.addEventListener('keydown', e => {

  if ([37,38,39,40].indexOf(e.which) > -1) e.preventDefault();

  // up arrow
  if (e.which === 38) store.dispatch({ type: 'SWIPE_UP' });
  // down arrow
  if (e.which === 40) store.dispatch({ type: 'SWIPE_DOWN' });

  // These may need to be more complicated actions, such as dispatching
  // and error animation / sound if already holding something or incompatible
  // right arrow
  if (e.which === 39) store.dispatch({ type: 'ACTIVATE' });
  // left arrow
  if (e.which === 37) store.dispatch({ type: 'PICKUP' });
}, false);

function render (interp, state) {

  state.screen.ctx.clearRect(0, 0, screen.width, screen.height);

  renderPlayer(interp, state);
  renderStations(interp, state);
}

function renderPlayer (interp, state) {
  const {
    screen,
    player,
    SPRITE_SIZE,
  } = state;

  const { offset } = player;
  const { cols, rows } = player.position;
  screen.ctx.fillStyle = 'white';
  screen.ctx.fillRect(
    (offset.cols + cols) * SPRITE_SIZE,
    (offset.rows + rows) * SPRITE_SIZE,
    SPRITE_SIZE, SPRITE_SIZE
  );
}

function renderStations (interp, state) {
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
    const blue = Math.floor((idx / entries.length) * 255);
    screen.ctx.fillStyle = 'rgba(255,50,' + blue + ',1)';
    screen.ctx.fillRect(
      col * SPRITE_SIZE,
      row * SPRITE_SIZE,
      SPRITE_SIZE, station.wh.rows * SPRITE_SIZE
    );
    rowsTotal += station.wh.rows;
  });
}

const newCustomer = () => (dispatch, getState) => (dispatch({
  type: 'NEW_CUSTOMER',
  data: {
    name: getState().rng() > 0.5 ? 'James' : 'Lily',
    wants: {
      type: getState().rng() > 0.5 ? 'AMERICANO' : 'ESPRESSO',
    }
  }
}));

store.dispatch(newCustomer());
store.dispatch(newCustomer());
