import { Store } from 'naivedux';
import Screen from './lib/screen';
import loadImage from './lib/load-image';
import Loop from './lib/loop';
//import swipeDetect from './lib/swipe-detect';

import initialLevelState from './src/initial-level-state';
import reducer from './src/level-reducer';
import drawPlayer from './src/draw-player';
import drawStations from './src/draw-stations';
import drawText from './src/draw-text';
import drawCustomers from './src/draw-customers';
import drawScore from './src/draw-score';
import drawFloorTiles from './src/draw-floor-tiles';
import drawSunbeams from './src/draw-sunbeams';
import drawBootView from './src/draw-boot-view';
import drawLog from './src/draw-log';
import drawSummaryView from './src/draw-summary-view';

import {
  stationInFrontOfPlayer,
} from './src/station-utils';

import {
  firstItemType,
} from './src/item-utils';

import {
  RENDER_UPDATE_DT,
  GAME_UPDATE_DT,

  LOG_ENTRY_ADDED,

  FONT_COLOR_WHITE,
  FONT_COLOR_BLACK,

  SWIPE_UP,
  SWIPE_DOWN,
  ACTIVATE,
  ACTIVATE_CEASE,
  DEBUG_TOGGLE,
  NEW_CUSTOMER,
  PICKUP_COUNTER,

  GAME_TICK,

  FILLED_AMERICANO_CUP,
  FILLED_CAPPUCCINO_CUP,
  FILLED_ESPRESSO_CUP,
} from './src/constants';

// Espresso: the coffee beverage produced by a pump or lever espresso machine. This Italian word describes a beverage made from 7 grams (+/- 2 grams) of finely ground coffee, producing 1-1.5 ounces (30-45ml) of extracted beverage under 9 bar (135psi) of brewing pressure at brewing temperatures of between 194 and 204 degrees Fahrenheit, over a period of 25 seconds (+/- 5 seconds) of brew time. Espresso is what this whole definition list is about!

function boot () {
  Promise.all([
    loadImage('assets/tiles.png'),

    // http://mfs.sub.jp/font.html
    loadImage('assets/m05-short.png'),
  ]).then(([tileImage, fontImage]) => {

    const store = new Store(reducer, initialLevelState(window.c, tileImage, fontImage));

    //store.dispatch({ type: 'LEVEL_INIT', data: 1 });
    //store.dispatch({ type: 'LEVEL_INIT', });

    store.subscribe(() => {

      const state = store.getState();

      if (state.debug) {
        let debugPanel = window.d;
        if (!debugPanel) {
          debugPanel = document.createElement('pre');
          debugPanel.id = 'd';
          debugPanel.style = 'display:block;position:absolute;color:white;overflow:scroll;z-index:9000;height:100%;width:100%;top:0;left:0';
          document.body.appendChild(debugPanel);
        }

        debugPanel.innerHTML = JSON.stringify(store.getState(), null, '  ');
      }

      render(1, state);
    });

    const loopCtrl = Loop({
      drawTime: RENDER_UPDATE_DT,
      updateTime: GAME_UPDATE_DT,
      draw: (interp) => {},
      update: (dt) => {
        store.dispatch({ type: GAME_TICK, data: dt });
        store.dispatch(actionMaybeNextLevel());
        store.dispatch(actionMaybeAddCustomer());
        store.dispatch(actionMaybeLogTimeRemaining());
      },
    });

    document.body.addEventListener('keydown', e => {

      if (e.which === 27) {
        loopCtrl.stop();
        console.log('halt in the name of science')
      }

      if ([37,38,39,40].indexOf(e.which) > -1) e.preventDefault();

      // up arrow
      if (e.which === 38) store.dispatch({ type: SWIPE_UP });
      // down arrow
      if (e.which === 40) store.dispatch({ type: SWIPE_DOWN });

      // These may need to be more complicated actions, such as dispatching
      // and error animation / sound if already holding something or incompatible
      // right arrow
      if (e.which === 39) { store.dispatch(actionActivate()); }
      // left arrow
      //if (e.which === 37) store.dispatch({ type: 'PICKUP' });

      // < + shift + cmd (mac, alt on windows)
      if (e.which === 188 && e.metaKey && e.shiftKey) store.dispatch({ type: DEBUG_TOGGLE });
    }, false);

    document.body.addEventListener('keyup', e => {
      if (e.which === 39) store.dispatch({ type: ACTIVATE_CEASE });
    }, false);
  });
}

const actionMaybeNextLevel = () => (dispatch, getState) => {
  const state = getState();

  // Level complete!
  if (
    state.view === 'LEVEL_VIEW'
    && state.levelTime >= state.levelMaxTime
  ) {

    if (state.levelIdx + 1 < state.levels.length) {
      return dispatch({ type: 'NEXT_LEVEL' });
    } else {
      // end game
      return dispatch({ type: 'SHOW_SUMMARY_VIEW' });
    }

    //dispatch({ type: 'HALT_PLAYER_LEVEL_CONTROL' });
    //dispatch({ type: 'SHOW_SUMMARY_SCREEN' });
  }
}

const actionActivate = () => (dispatch, getState) => {
  const state = getState();

  if (state.view === 'LEVEL_VIEW') {

    const playerStation = stationInFrontOfPlayer(state);
    const { player } = state;

    if (playerStation.type === PICKUP_COUNTER) {
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
          type: 'CUSTOMER_DRINK_READY',
          data: closestIdx,
        });
      }
    }

    if (!state.player.isActivating) {
      return dispatch({ type: ACTIVATE });
    }
  }

  if (state.view === 'BOOT_GAME_VIEW') {
    return dispatch({ type: 'NEXT_LEVEL' });
  }

  /*if (state.view === 'LEVEL_SUMMARY_VIEW') {
    dispatch({ type: 'NEXT_LEVEL' });
    dispatch({ type: 'RESUME_PLAYER_LEVEL_CONTROL' });
    return;
  }*/
}

const actionMaybeLogTimeRemaining = () => (dispatch, getState) => {
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

const actionMaybeAddCustomer = () => (dispatch, getState) => {

  const state = getState();

  if (state.view !== 'LEVEL_VIEW') return;

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

function render (interp, state) {
  const { screen, view, } = state;
  screen.ctx.clearRect(0, 0, screen.width, screen.height);

  if (view === 'LEVEL_VIEW') {
    drawFloorTiles(interp, state);
    drawPlayer(interp, state);
    drawStations(interp, state);
    drawCustomers(interp, state);
    drawScore(interp, state);
    drawLog(interp, state);
    drawSunbeams(interp, state);
  }

  if (view === 'BOOT_GAME_VIEW') {
    drawFloorTiles(interp, state);
    drawStations(interp, state);
    drawBootView(interp, state);
  }

  if (view === 'SUMMARY_VIEW') {
    drawSummaryView(interp, state);
  }
}

boot();
