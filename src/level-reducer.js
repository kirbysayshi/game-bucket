import {
  GAME_TICK,
  SWIPE_UP,
  SWIPE_DOWN,
  ACTIVATE,
  ACTIVATE_CEASE,
  NEW_CUSTOMER,
  DEBUG_TOGGLE,
  LOG_ENTRY_ADDED,
  NEXT_LEVEL,
  SHOW_SUMMARY_VIEW,
  CUSTOMER_DRINK_READY,

  GROUPHEAD,
  CLEAN_PORTAFILTER,
  FILLED_PORTAFILTER,
  FILLED_AMERICANO_CUP,
  FILLED_CAPPUCCINO_CUP,
  FILLED_ESPRESSO_CUP,
  FILLED_STEAMED_MILK_CUP,
  FILLED_HOT_WATER_CUP,
  CLEAN_CUP,
  GRINDER,
  ORDER_COUNTER,
  PICKUP_COUNTER,
  TRASH,
  CUP_COUNTER,
  HOT_WATER,
  STEAMER,

  GAME_UPDATE_DT,
  REPUTATION_GAINED,

  BETWEEN_LEVEL_VIEW,
  BOOT_GAME_VIEW,
  LEVEL_VIEW,
  SUMMARY_VIEW,

} from './constants';

import {
  stationInFrontOfPlayer,
} from './station-utils';

import {
  takeItemOfType,
  addItemOfType,
  hasItemOfType,
  removeItemOfType,
  emptyItems,
  firstItemType,
  hasWhichItem,
  defaultItemSort,
} from './item-utils';

import initialLevelState from './initial-level-state';

export default function reducer (state, action) {
  
  if (action.type === BETWEEN_LEVEL_VIEW) {
    state.view = BETWEEN_LEVEL_VIEW;
    return state;
  }

  if (action.type === NEXT_LEVEL) {
    const next = initialLevelState(state.screen.cvs, state.tileImage, state.fontImage);
    // and whatever else needs to be saved between levels...
    next.money = state.money;
    next.reputation = state.reputation;
    next.totalCustomersServed = state.totalCustomersServed;
    next.levelIdx = state.view === BOOT_GAME_VIEW ? 0 : state.levelIdx + 1;
    next.view = LEVEL_VIEW;
    return next;
  }

  if (action.type === SHOW_SUMMARY_VIEW) {
    state.view = SUMMARY_VIEW;
    // compute player summary
    state.customers.forEach(customer => {
      if (customer.paid === true) {
        // they paid and got no drink!
        state.reputation -= REPUTATION_GAINED;
      }
    });
    return state;
  }

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
        rows: 0,
        cols: 0,
      },
    });
    positionCustomers(state);
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

  if (action.type === LOG_ENTRY_ADDED) {
    const { log } = state;
    log.push(action.data);
    while(log.length > 5) log.shift();
    return state;
  }

  if (action.type === GAME_TICK && state.view === LEVEL_VIEW) {

    state.levelTime += GAME_UPDATE_DT;

    // look through all active timers and increment
    // grouphead will flow without player sitting there
    // grinder requires player to sit there
    const { player, stations, } = state;
    const playerStation = stationInFrontOfPlayer(state);
    for (let i = 0; i < stations.entries.length; i++) {
      const station = stations.entries[i];
      if (!station.timer) continue;

      if (
        station.timer.active
        && (station.timer.value / station.timer.max) >= station.timer.green
      ) {

        if (
          station.type === GROUPHEAD
          && hasItemOfType(station, CLEAN_CUP)
        ) {
          // convert cup into something
          removeItemOfType(station, CLEAN_CUP);
          addItemOfType(station, FILLED_ESPRESSO_CUP);
        }

        if (
          station.type === GROUPHEAD
          && hasItemOfType(station, FILLED_HOT_WATER_CUP)
        ) {
          // convert cup into something
          removeItemOfType(station, FILLED_HOT_WATER_CUP);
          addItemOfType(station, FILLED_AMERICANO_CUP);
        }

        if (
          station.type === HOT_WATER
          && hasItemOfType(station, FILLED_ESPRESSO_CUP)
        ) {
          const removed = removeItemOfType(station, FILLED_ESPRESSO_CUP);
          const added = addItemOfType(station, FILLED_AMERICANO_CUP);
          added.wellBrewed = removed.wellBrewed;
        }

        if (
          station.type === HOT_WATER
          && hasItemOfType(station, CLEAN_CUP)
        ) {
          const removed = removeItemOfType(station, CLEAN_CUP);
          const added = addItemOfType(station, FILLED_HOT_WATER_CUP, CLEAN_CUP);
          added.wellBrewed = removed.wellBrewed;
        }

        if (
          station.type === STEAMER
          && hasItemOfType(station, FILLED_ESPRESSO_CUP)
        ) {
          const removed = removeItemOfType(station, FILLED_ESPRESSO_CUP);
          const added = addItemOfType(station, FILLED_CAPPUCCINO_CUP);
          added.wellBrewed = removed.wellBrewed;
        }

        if (
          station.type === STEAMER
          && hasItemOfType(station, CLEAN_CUP)
        ) {
          const removed = removeItemOfType(station, CLEAN_CUP);
          const added = addItemOfType(station, FILLED_STEAMED_MILK_CUP, FILLED_CAPPUCCINO_CUP);
          added.wellBrewed = removed.wellBrewed;
        }
      }

      if (
        station.timer.active
        && station.timer.value >= station.timer.max
      ) {

        station.timer.active = false;

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
        && station.timer.active
        && playerStation === station
        && player.isActivating
      ) {
        station.timer.value += 1;
      }

      // Non-hold stations
      if (
        !station.timer.hold
        && station.timer.active
      ) {
        station.timer.value += 1;
      }
    }

    return state;
  }

  if (action.type === ACTIVATE) {
    // what station the player is in front of
    // what is the player holding
    const { player } = state;
    const playerStation = stationInFrontOfPlayer(state);

    if (playerStation.type === HOT_WATER) {

      // player put a cup there
      if (
        (hasItemOfType(player, FILLED_ESPRESSO_CUP)
        || hasItemOfType(player, CLEAN_CUP))
        && playerStation.has.length === 0
      ) {
        takeItemOfType(playerStation, player, firstItemType(player));
        return state;
      }

      // has espresso, player activates water
      if (
        playerStation.has.length === 1
        && (hasItemOfType(playerStation, FILLED_ESPRESSO_CUP)
          || hasItemOfType(playerStation, CLEAN_CUP))
      ) {
        playerStation.timer.active = true;
        player.isActivating = true;
        return state;
      }

      if (
        //hasItemOfType(playerStation, FILLED_AMERICANO_CUP)
        playerStation.has.length
        && playerStation.timer.active === false
        //|| hasItemOfType(playerStation, CLEAN_CUP)
      ) {
        takeItemOfType(player, playerStation, firstItemType(playerStation));

        // reset the station
        playerStation.timer.value = 0;

        return state;
      }

    }

    if (playerStation.type === GROUPHEAD) {

      // BREW COFFEE!
      if (
        hasItemOfType(playerStation, FILLED_PORTAFILTER)
        && (hasItemOfType(playerStation, CLEAN_CUP)
          || hasItemOfType(playerStation, FILLED_HOT_WATER_CUP))
      ) {
        playerStation.timer.active = true;
        player.isActivating = true;
        return state;
      }

      // Toggle brewing
      if (
        hasItemOfType(playerStation, FILLED_PORTAFILTER)
        //&& hasItemOfType(playerStation, CLEAN_CUP)
        && playerStation.timer.active === true
      ) {
        playerStation.timer.active = false;
        player.isActivating = true;
        return state;
      }

      // Take the brewed espresso
      if (
        player.has.length === 0
        && hasItemOfType(playerStation, FILLED_PORTAFILTER)
        && (hasItemOfType(playerStation, FILLED_ESPRESSO_CUP)
          || hasItemOfType(playerStation, FILLED_AMERICANO_CUP))
      ) {
        const type = hasWhichItem(playerStation, [
          FILLED_ESPRESSO_CUP,
          FILLED_AMERICANO_CUP
        ]);
        takeItemOfType(player, playerStation, type);
        const percentage = playerStation.timer.value / playerStation.timer.max;
        player.has[0].wellBrewed = percentage <= playerStation.timer.red;

        // Reset the station
        removeItemOfType(playerStation, FILLED_PORTAFILTER);
        addItemOfType(playerStation, CLEAN_PORTAFILTER);
        playerStation.timer.value = 0;

        return state;
      }

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

      if (
        (hasItemOfType(player, CLEAN_CUP) || hasItemOfType(player, FILLED_HOT_WATER_CUP))
        && !hasItemOfType(playerStation, CLEAN_CUP)
        && !hasItemOfType(playerStation, FILLED_AMERICANO_CUP)
        && !hasItemOfType(playerStation, FILLED_ESPRESSO_CUP)
        && !hasItemOfType(playerStation, FILLED_CAPPUCCINO_CUP)
        && !hasItemOfType(playerStation, FILLED_HOT_WATER_CUP)
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
      playerStation.timer.active = true;
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

    if (playerStation.type === TRASH) {

      if (hasItemOfType(player, FILLED_PORTAFILTER)) {
        removeItemOfType(player, FILLED_PORTAFILTER);
        addItemOfType(player, CLEAN_PORTAFILTER);
        return state;
      } else if (player.has.length && !hasItemOfType(player, CLEAN_PORTAFILTER)) {
        removeItemOfType(player, firstItemType(player));
        return state;
      }
    }

    if (playerStation.type === STEAMER) {

      // put an item into the steamer
      if (
        playerStation.has.length === 0
        && (
          hasItemOfType(player, FILLED_ESPRESSO_CUP)
          || hasItemOfType(player, FILLED_AMERICANO_CUP)
          || hasItemOfType(player, CLEAN_CUP)
        )
      ) {
        takeItemOfType(playerStation, player, firstItemType(player));
        return state;
      }

      // Start steaming
      if (
        hasItemOfType(playerStation, FILLED_ESPRESSO_CUP)
        || hasItemOfType(playerStation, FILLED_AMERICANO_CUP)
        || hasItemOfType(playerStation, CLEAN_CUP)
      ) {
        // begin filling + timer
        player.isActivating = true;
        playerStation.timer.active = true;
        return state;
      }

      // Take whatever is on the station
      if (
        playerStation.has.length !== 0
        && player.has.length === 0
        //hasItemOfType(playerStation, FILLED_CAPPUCCINO_CUP)
        //|| hasItemOfType(playerStation, )
        //|| hasItemOfType(playerStation, CLEAN_CUP)
        && !player.isActivating
      ) {
        takeItemOfType(player, playerStation, firstItemType(playerStation));
        playerStation.timer.value = 0;
        return state;
      }
    }
  }

  if (action.type === CUSTOMER_DRINK_READY) {
    const { player } = state;
    if (
      hasItemOfType(player, FILLED_ESPRESSO_CUP)
      || hasItemOfType(player, FILLED_CAPPUCCINO_CUP)
      || hasItemOfType(player, FILLED_AMERICANO_CUP)
      || hasItemOfType(player, FILLED_STEAMED_MILK_CUP)
      || hasItemOfType(player, FILLED_HOT_WATER_CUP)
    ) {

      const type = firstItemType(player);
      const item = removeItemOfType(player, type);
      const { customers } = state;
      const closestIdx = action.data;
      if (item.wellBrewed) {
        state.reputation += REPUTATION_GAINED;
      }

      state.totalCustomersServed += 1;
      customers.splice(closestIdx, 1);
      positionCustomers(state);
    }
  }

  return state;
}

function positionCustomers (state) {
  const offset = 0.5;
  const { customers, SPRITE_COLS, } = state;
  customers.forEach((customer, i) => {
    customer.position = {
      rows: offset + i,
      cols: Math.floor(SPRITE_COLS / 2),
    }
  })
}