import { Store } from 'naivedux';
import Screen from './lib/screen';
import loadImage from './lib/load-image';
import Loop from './lib/loop';
//import swipeDetect from './lib/swipe-detect';

import initialState from './src/initial-state';
import reducer from './src/reducer';
import drawPlayer from './src/draw-player';
import drawStations from './src/draw-stations';
import drawText from './src/draw-text';
import drawCustomers from './src/draw-customers';
import drawScore from './src/draw-score';
import drawFloorTiles from './src/draw-floor-tiles';
import drawSunbeams from './src/draw-sunbeams';

import {
  RENDER_UPDATE_DT,
  GAME_UPDATE_DT,

  FONT_COLOR_WHITE,
  FONT_COLOR_BLACK,

  SWIPE_UP,
  SWIPE_DOWN,
  ACTIVATE,
  ACTIVATE_CEASE,
  DEBUG_TOGGLE,
  NEW_CUSTOMER,

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

    const store = new Store(reducer, initialState(window.c, tileImage, fontImage));

    store.dispatch({ type: 'LEVEL_INIT', data: 1 });
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
        // dispatch a GAME_TICK event that the reducer applies only for timers currently ACTIVE
        store.dispatch({ type: GAME_TICK, data: dt });

        const state = store.getState();

        if (state.levelTime >= state.levelMaxTime) {
          store.dispatch({  })
        }
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
      if (e.which === 39) {
        if (!store.getState().player.isActivating) {
          store.dispatch({ type: ACTIVATE });
        }
      }
      // left arrow
      //if (e.which === 37) store.dispatch({ type: 'PICKUP' });

      // < + shift + cmd (mac, alt on windows)
      if (e.which === 188 && e.metaKey && e.shiftKey) store.dispatch({ type: DEBUG_TOGGLE });
    }, false);

    document.body.addEventListener('keyup', e => {
      if (e.which === 39) store.dispatch({ type: ACTIVATE_CEASE });
    }, false);

    const newCustomer = () => (dispatch, getState) => {

      const name = getState().rng() > 0.5 ? 'James' : 'Lily';

      const typeRand = getState().rng();
      const type = typeRand < 0.3
        ? FILLED_AMERICANO_CUP
        : typeRand < 0.5
          ? FILLED_ESPRESSO_CUP
          : FILLED_CAPPUCCINO_CUP;

      dispatch({
        type: NEW_CUSTOMER,
        data: {
          name,
          wants: {
            type,
            name: type === FILLED_AMERICANO_CUP
              ? 'Americano'
              : type === FILLED_ESPRESSO_CUP
                ? 'Espresso'
                : 'Cappuccino'
          }
        }
      })
    }

    store.dispatch(newCustomer());
    store.dispatch(newCustomer());
    store.dispatch(newCustomer());
    store.dispatch(newCustomer());
    store.dispatch(newCustomer());
    store.dispatch(newCustomer());
    store.dispatch(newCustomer());


  });
}

function render (interp, state) {
  const { screen, SPRITE_ROWS, SPRITE_COLS, } = state;
  screen.ctx.fillStyle = '#333333';
  screen.ctx.fillRect(0, 0, screen.width, screen.height);

  drawFloorTiles(interp, state);
  drawPlayer(interp, state);
  drawStations(interp, state);
  drawCustomers(interp, state);
  drawScore(interp, state);
  drawSunbeams(interp, state);
}

boot();
