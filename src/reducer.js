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
  CLEAN_CUP,
  GRINDER,
  ORDER_COUNTER,
  TRASH,
  CUP_COUNTER,

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
          emptyItems(station);
          addItemOfType(station, FILLED_PORTAFILTER);
          return state;
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

      if (
        hasItemOfType(playerStation, CLEAN_PORTAFILTER)
        && player.has.length === 0
      ) {
        takeItemOfType(player, playerStation, CLEAN_PORTAFILTER);
        return state;
      }

      if (
        (
          hasItemOfType(player, CLEAN_PORTAFILTER)
          || hasItemOfType(player, FILLED_PORTAFILTER)
        )
        && !(
          hasItemOfType(playerStation, CLEAN_PORTAFILTER)
          || hasItemOfType(playerStation, FILLED_PORTAFILTER)
        )
      ) {
        takeItemOfType(playerStation, player, firstItemType(player));
        return state;
      }
    }

    if (playerStation.type === CUP_COUNTER) {
      if (player.has.length === 0) {
        addItemOfType(player, CLEAN_CUP);
        return state;
      }

      if (hasItemOfType(player, CLEAN_CUP)) {
        removeItemOfType(player, CLEAN_CUP);
        return state;
      }
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
      && hasItemOfType(playerStation, CLEAN_PORTAFILTER)
    ) {
      // begin filling + timer
      player.isActivating = true;
      return state;
    }

    if (
      playerStation.type === GRINDER
      && hasItemOfType(playerStation, FILLED_PORTAFILTER)
      && !player.isActivating
    ) {
      // May need to check if the player has released the key to prevent auto-grab
      takeItemOfType(player, playerStation, FILLED_PORTAFILTER);
      playerStation.timer.value = 0;
      return state;
    }

    if (
      playerStation.type === GRINDER
      && hasItemOfType(player, CLEAN_PORTAFILTER)
    ) {
      takeItemOfType(playerStation, player, CLEAN_PORTAFILTER);
      return state;
    }

    if (
      playerStation.type === TRASH
      && hasItemOfType(player, FILLED_PORTAFILTER)
    ) {
      removeItemOfType(player, FILLED_PORTAFILTER);
      addItemOfType(player, CLEAN_PORTAFILTER);
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

function takeItemOfType (taker, giver, type) {
  const idx = giver.has.findIndex(item => item.type === type);
  if (idx === -1) return;
  const item = giver.has.splice(idx, 1);
  taker.has.push(item[0]); // TODO: sorting?
}

function addItemOfType (taker, type) {
  // TODO: sorting?
  taker.has.push({ type });
}

function hasItemOfType (giver, type) {
  return giver.has.find(item => item.type === type);
}

function removeItemOfType (giver, type) {
  const idx = giver.has.findIndex(item => item.type === type);
  if (idx === -1) return;
  giver.has.splice(idx, 1);
}

function emptyItems (giver) {
  giver.has.length = 0;
}

function firstItemType(giver) {
  return giver.has[0].type;
}