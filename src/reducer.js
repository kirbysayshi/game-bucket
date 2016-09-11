import {
  SWIPE_UP,
  SWIPE_DOWN,
  ACTIVATE,
  NEW_CUSTOMER,
  DEBUG_TOGGLE,

  GROUPHEAD,
  CLEAN_PORTAFILTER,
  GRINDER,
  ORDER_COUNTER,
} from './constants';

export default function reducer (state, action) {
  
  // TODO: figure out some sort of immutability helper. maybe just ... ?

  if (action.type === DEBUG_TOGGLE) {
    state.debug = !state.debug;
  }

  if (action.type === NEW_CUSTOMER) {
    const { SPRITE_COLS } = state;
    state.customers.push({
      name: action.data.name,
      wants: action.data.wants,
      paid: false,
      // TODO: compute all customers positions when a new one comes in
      position: {
        rows: state.customers.length,
        cols: Math.floor(SPRITE_COLS / 2),
      },
    });
  }
  
  if (action.type === SWIPE_UP) {
    const row = state.player.position.rows -= 1;
    if (row < 0) {
      state.player.position.rows = 0;
    }
  }
  
  if (action.type === SWIPE_DOWN) {
    const row = state.player.position.rows += 1;
    if (row >= state.player.field.rows) {
      state.player.position.rows = state.player.field.rows;
    }
  }
  
  if (action.type === ACTIVATE) {
    // what station the player is in front of
    // what is the player holding
    const { player } = state;
    const {
      position,
    } = state.player;
    const { entries } = state.stations;
    const station = entries[position.rows];

    if (station.type === GROUPHEAD) {
      if (!player.has && station.has) {
        player.has = station.has;
        station.has = null;
      } else if (
        player.has
        && player.has.type === CLEAN_PORTAFILTER
        && !station.has
      ) {
        station.has = player.has;
        player.has = null;
      }
    }

    if (station.type === ORDER_COUNTER) {
      for (let i = 0; i < state.customers.length; i++) {
        const customer = state.customers[i];
        if (!customer.paid) {
          state.money += 5; // how much is each drink!?
          customer.paid = true;
          break;
        }
      }
    }

    if (
      station.type === GRINDER
      && station.has
      && station.has.type === CLEAN_PORTAFILTER
    ) {
      // begin filling + timer
    }

    if (
      station.type === GRINDER
      && player.has
      && player.has.type === CLEAN_PORTAFILTER
    ) {
      station.has = player.has;
      player.has = null;
      // should return here...
    }
  }

  return state;
}