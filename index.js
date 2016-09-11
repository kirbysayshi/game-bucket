import { Store } from 'naivedux';
import Screen from './lib/screen';
import loadImage from './lib/load-image';

import initialState from './src/initial-state';
import reducer from './src/reducer';
import drawPlayer from './src/draw-player';
import drawStations from './src/draw-stations';
import drawText from './src/draw-text';
import drawCustomers from './src/draw-customers';
import drawScore from './src/draw-score';

import {
  FONT_COLOR_WHITE,
  FONT_COLOR_BLACK,

  SWIPE_UP,
  SWIPE_DOWN,
  ACTIVATE,
  DEBUG_TOGGLE,
  NEW_CUSTOMER,
} from './src/constants';

// Espresso: the coffee beverage produced by a pump or lever espresso machine. This Italian word describes a beverage made from 7 grams (+/- 2 grams) of finely ground coffee, producing 1-1.5 ounces (30-45ml) of extracted beverage under 9 bar (135psi) of brewing pressure at brewing temperatures of between 194 and 204 degrees Fahrenheit, over a period of 25 seconds (+/- 5 seconds) of brew time. Espresso is what this whole definition list is about!

function boot () {
  Promise.all([
    loadImage('assets/tiles.png'),

    // http://mfs.sub.jp/font.html
    loadImage('assets/m05-short.png'),
  ]).then(([tileImage, fontImage]) => {

    const store = new Store(reducer, initialState(window.c, tileImage, fontImage));

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

    document.body.addEventListener('keydown', e => {

      if ([37,38,39,40].indexOf(e.which) > -1) e.preventDefault();

      // up arrow
      if (e.which === 38) store.dispatch({ type: SWIPE_UP });
      // down arrow
      if (e.which === 40) store.dispatch({ type: SWIPE_DOWN });

      // These may need to be more complicated actions, such as dispatching
      // and error animation / sound if already holding something or incompatible
      // right arrow
      if (e.which === 39) store.dispatch({ type: ACTIVATE });
      // left arrow
      //if (e.which === 37) store.dispatch({ type: 'PICKUP' });

      // < + shift + cmd (mac, alt on windows)
      if (e.which === 188 && e.metaKey && e.shiftKey) store.dispatch({ type: DEBUG_TOGGLE });
    }, false);

    const newCustomer = () => (dispatch, getState) => (dispatch({
      type: NEW_CUSTOMER,
      data: {
        name: getState().rng() > 0.5 ? 'James' : 'Lily',
        wants: {
          type: getState().rng() > 0.5 ? 'AMERICANO' : 'ESPRESSO',
        }
      }
    }));

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

  drawPlayer(interp, state);
  drawStations(interp, state);
  drawCustomers(interp, state);
  drawScore(interp, state);

  const rowHeight = screen.height / SPRITE_ROWS;
  screen.ctx.save();
  screen.ctx.fillStyle = 'rgba(32, 32, 32, 0.2)';
  screen.ctx.beginPath();
  screen.ctx.moveTo(screen.width, rowHeight * 2);
  screen.ctx.lineTo(0, rowHeight * 10);
  screen.ctx.lineTo(0, screen.height);
  screen.ctx.lineTo(screen.width, screen.height);
  screen.ctx.fill();
  screen.ctx.restore();
}

boot();
