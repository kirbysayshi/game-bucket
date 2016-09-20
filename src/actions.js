import {

  LOG_ENTRY_ADDED,

  ACTIVATE,
  NEW_CUSTOMER,
  PICKUP_COUNTER,

  NEXT_LEVEL,
  CUSTOMER_DRINK_READY,

  FILLED_AMERICANO_CUP,
  FILLED_CAPPUCCINO_CUP,
  FILLED_ESPRESSO_CUP,

  BOOT_GAME_VIEW,
  BETWEEN_LEVEL_VIEW,
  SHOW_SUMMARY_VIEW,
  LEVEL_VIEW,

} from './constants';

import {
  stationInFrontOfPlayer,
} from './station-utils';

import {
  firstItemType,
} from './item-utils';

export const actionMaybeNextLevel = () => (dispatch, getState) => {
  const state = getState();

  // Level complete!
  if (
    state.view === LEVEL_VIEW
    && state.levelTime >= state.levelMaxTime
  ) {

    if (state.levelIdx + 1 < state.levels.length) {
      //return dispatch({ type: 'NEXT_LEVEL' });
      return dispatch({ type: BETWEEN_LEVEL_VIEW });
    } else {
      // end game
      return dispatch({ type: SHOW_SUMMARY_VIEW });
    }

    //dispatch({ type: 'HALT_PLAYER_LEVEL_CONTROL' });
    //dispatch({ type: 'SHOW_SUMMARY_SCREEN' });
  }
}

export const actionActivate = () => (dispatch, getState) => {
  const state = getState();

  if (state.view === LEVEL_VIEW) {

    const playerStation = stationInFrontOfPlayer(state);
    const { player } = state;

    if (player.has.length && playerStation.type === PICKUP_COUNTER) {
      const type = firstItemType(player);
      const { customers } = state;
      const closestIdx = customers.findIndex(c => c.wants.type === type);

      if (closestIdx > -1) {
        const customer = customers[closestIdx];
        if (!customer.paid) {
          return dispatch({
            type: LOG_ENTRY_ADDED,
            data: 'They need to pay to receive the drink!',
          });
        }

        return dispatch({
          type: CUSTOMER_DRINK_READY,
          data: closestIdx,
        });
      }
    }

    if (!state.player.isActivating) {
      return dispatch({ type: ACTIVATE });
    }
  }

  if (state.view === BOOT_GAME_VIEW) {
    return dispatch({ type: NEXT_LEVEL });
  }

  if (state.view === BETWEEN_LEVEL_VIEW) {
    return dispatch({ type: NEXT_LEVEL });
  }

  /*if (state.view === 'LEVEL_SUMMARY_VIEW') {
    dispatch({ type: 'NEXT_LEVEL' });
    dispatch({ type: 'RESUME_PLAYER_LEVEL_CONTROL' });
    return;
  }*/
}

export const actionMaybeLogTimeRemaining = () => (dispatch, getState) => {
  const state = getState();

  const pct = state.levelTime / state.levelMaxTime;
  const key = pct.toPrecision(2)

  if (state.hasLoggedElapsedForPct[key]) return;

  if (key === '0.25') {
    dispatch({ type: LOG_ENTRY_ADDED, data: 'Phew, a quarter through my shift!' });
    state.hasLoggedElapsedForPct[key] = true;
    return;
  }

  if (key === '0.5') {
    dispatch({ type: LOG_ENTRY_ADDED, data: 'Halfway through my shift!' });
    state.hasLoggedElapsedForPct[key] = true;
    return;
  }

  if (key === '0.75') {
    dispatch({ type: LOG_ENTRY_ADDED, data: 'Just a quarter of my shift left!' });
    state.hasLoggedElapsedForPct[key] = true;
    return;
  }

  if (key === '0.91') {
    dispatch({ type: LOG_ENTRY_ADDED, data: 'I think I can see daylight!' });
    state.hasLoggedElapsedForPct[key] = true;
    return;
  }

  if (key === '0.92') {
    dispatch({ type: LOG_ENTRY_ADDED, data: 'What is \'daylight\'?' });
    state.hasLoggedElapsedForPct[key] = true;
    return;
  }

  if (key === '0.93') {
    dispatch({ type: LOG_ENTRY_ADDED, data: 'I remember now!' });
    state.hasLoggedElapsedForPct[key] = true;
    return;
  }

  if (key === '0.94') {
    dispatch({ type: LOG_ENTRY_ADDED, data: 'Daylight is definitely approaching!' });
    state.hasLoggedElapsedForPct[key] = true;
    return;
  }

  if (key === '0.95') {
    dispatch({ type: LOG_ENTRY_ADDED, data: 'It\'s getting so bright!' });
    state.hasLoggedElapsedForPct[key] = true;
    return;
  }

  if (key === '0.96') {
    dispatch({ type: LOG_ENTRY_ADDED, data: 'So bright...' });
    state.hasLoggedElapsedForPct[key] = true;
    return;
  }

  if (key === '0.97') {
    dispatch({ type: LOG_ENTRY_ADDED, data: 'So sleepy...' });
    state.hasLoggedElapsedForPct[key] = true;
    return;
  }

  if (key === '0.98') {
    dispatch({ type: LOG_ENTRY_ADDED, data: 'I can almost smell my bed...' });
    state.hasLoggedElapsedForPct[key] = true;
    return;
  }

  if (key === '0.99') {
    dispatch({ type: LOG_ENTRY_ADDED, data: 'Almost time to close up!' });
    state.hasLoggedElapsedForPct[key] = true;
    return;
  }

  if (key === '1') {
    dispatch({ type: LOG_ENTRY_ADDED, data: 'Everybody out!' });
    state.hasLoggedElapsedForPct[key] = true;
    return;
  }
}

export const actionMaybeAddCustomer = () => (dispatch, getState) => {

  const state = getState();

  if (state.view !== LEVEL_VIEW) return;

  const {
    lastCustomerSpawnDT,
    levelTime,
    rng,
    customerNames,
    customers,
  } = state;

  const level = state.levels[state.levelIdx];

  const INITIAL_MIN_SPAWN_ELAPSED = 0;

  let hasSpawnedOneThisTick = false;

  level.wants.forEach(wants => {
    if (hasSpawnedOneThisTick) return;

    // Only spawn a customer if enough time has passed, or this is the first
    // tick and we've passed the INITIAL_MIN_SPAWN_ELAPSED
    if (
      (lastCustomerSpawnDT === 0
        && levelTime >= INITIAL_MIN_SPAWN_ELAPSED)
      || levelTime - lastCustomerSpawnDT > wants.minimumTime
    ) {
      const roll = rng();
      if (roll > wants.rarity) {
        // SPAWN!
        // find a name
        let possibles = customerNames.filter(possible => possible.hasSpawned === false);
        if (!possibles.length) {
          // reset spawn status
          customerNames.forEach(possible => possible.hasSpawned = false);
          possibles = customerNames;
        }

        const nameIdx = Math.floor(rng() * (possibles.length - 1));
        const possible = possibles[nameIdx];
        // MUTATION: This should be a dispatch.
        possible.hasSpawned = true;

        dispatch({
          type: NEW_CUSTOMER,
          data: {
            name: possible.name,
            wants: {
              type: wants.type,

              // TODO: add glitch + more here
              name: wants.type === FILLED_AMERICANO_CUP
                ? 'Americano'
                : wants.type === FILLED_ESPRESSO_CUP
                  ? 'Espresso'
                  : 'Cappuccino'
            }
          }
        });

        dispatch({
          type: LOG_ENTRY_ADDED,
          data: 'A new customer walked in!',
        });

        // first customer of the shift.
        if (state.lastCustomerSpawnDT === 0) {
          dispatch({
            type: LOG_ENTRY_ADDED,
            data: '... I\'d better take their money █.',
          });
        }

        hasSpawnedOneThisTick = true;
        // MUTATION: This should be a dispatch.
        state.lastCustomerSpawnDT = levelTime;
      }
    }
  });
}