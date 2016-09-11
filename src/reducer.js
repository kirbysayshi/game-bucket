import {
  GAME_TICK,
  SWIPE_UP,
  SWIPE_DOWN,
  ACTIVATE,
  ACTIVATE_CEASE,
  NEW_CUSTOMER,
  DEBUG_TOGGLE,

  GROUPHEAD,
  CLEAN_PORTAFILTER,
  FILLED_PORTAFILTER,
  GRINDER,
  ORDER_COUNTER,
} from './constants';

export default function reducer (state, action) {
  
  // TODO: figure out some sort of immutability helper. maybe just ... ?

  if (action.type === DEBUG_TOGGLE) {
    state.debug = !state.debug;
    return state;
  }

  if (action.type === ACTIVATE_CEASE) {
    const { player } = state;
    player.isActivating = false;
    return state;
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
    return state;
  }
  
  if (action.type === SWIPE_UP) {
    const row = state.player.position.rows -= 1;
    if (row < 0) {
      state.player.position.rows = 0;
    }
    return state;
  }

  if (action.type === SWIPE_DOWN) {
    const row = state.player.position.rows += 1;
    if (row >= state.player.field.rows) {
      state.player.position.rows = state.player.field.rows;
    }
    return state;
  }

  if (action.type === GAME_TICK) {
    // look through all active timers and increment
    // grouphead will flow without player sitting there
    // grinder requires player to sit there
    const { player, stations, } = state;
    const playerStation = stationInFrontOfPlayer(state);
    for (let i = 0; i < stations.entries.length; i++) {
      const station = stations.entries[i];
      if (!station.timer) continue;

      if (station.timer.value >= station.timer.max) {

        // Only put transformation logic here. Resetting the timer should only
        // happen when the item is removed / station reactivated.
        if (station.type === GRINDER) {
          station.has = { type: FILLED_PORTAFILTER }
        }
      }

      // Player is activating in front of the station
      if (
        station.timer.hold
        && playerStation === station
        && player.isActivating
        && station.timer.value < station.timer.max
      ) {
        station.timer.value += 1;
        console.log(station.timer.value);
      }

      // Non-hold stations
      if (
        !station.timer.hold
        && station.timer.value < station.timer.max
      ) {
        station.timer.value += 1;
        console.log(station.timer.value);
      }
    }

    return state;
  }

  if (action.type === ACTIVATE) {
    // what station the player is in front of
    // what is the player holding
    const { player } = state;
    const playerStation = stationInFrontOfPlayer(state);

    if (playerStation.type === GROUPHEAD) {
      if (!player.has && playerStation.has) {
        player.has = playerStation.has;
        playerStation.has = null;
      } else if (
        player.has
        && player.has.type === CLEAN_PORTAFILTER
        && !playerStation.has
      ) {
        playerStation.has = player.has;
        player.has = null;
      }
      return state;
    }

    if (playerStation.type === ORDER_COUNTER) {
      for (let i = 0; i < state.customers.length; i++) {
        const customer = state.customers[i];
        if (!customer.paid) {
          state.money += 5; // how much is each drink!?
          customer.paid = true;
          break;
        }
      }
      return state;
    }

    if (
      playerStation.type === GRINDER
      && playerStation.has
      && playerStation.has.type === CLEAN_PORTAFILTER
    ) {
      // begin filling + timer
      player.isActivating = true;
      return state;
    }

    if (
      playerStation.type === GRINDER
      && playerStation.has
      && playerStation.has.type === FILLED_PORTAFILTER
      && !player.isActivating
    ) {
      // May need to check if the player has released the key to prevent auto-grab
      player.has = playerStation.has;
      playerStation.has = null;
      playerStation.timer.value = 0;
      return state;
    }

    if (
      playerStation.type === GRINDER
      && player.has
      && player.has.type === CLEAN_PORTAFILTER
    ) {
      playerStation.has = player.has;
      player.has = null;
      return state;
    }
  }

  return state;
}

function stationInFrontOfPlayer (state) {
  // what station the player is in front of
  // what is the player holding
  const { player, } = state;
  const { position, } = state.player;
  const { entries, } = state.stations;
  const station = entries[position.rows];
  return station;
}