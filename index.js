import { Store } from 'naivedux';
import Screen from './lib/screen';
import loadImage from './lib/load-image';

import initialState from './src/initial-state';
import reducer from './src/reducer';
import drawPlayer from './src/draw-player';
import drawStations from './src/draw-stations';

// Espresso: the coffee beverage produced by a pump or lever espresso machine. This Italian word describes a beverage made from 7 grams (+/- 2 grams) of finely ground coffee, producing 1-1.5 ounces (30-45ml) of extracted beverage under 9 bar (135psi) of brewing pressure at brewing temperatures of between 194 and 204 degrees Fahrenheit, over a period of 25 seconds (+/- 5 seconds) of brew time. Espresso is what this whole definition list is about!

function boot () {
  loadImage('assets/tiles.png').then(sheet => {

    const store = new Store(reducer, initialState(window.c, sheet));

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

  });
}

function render (interp, state) {
  state.screen.ctx.clearRect(0, 0, screen.width, screen.height);
  drawPlayer(interp, state);
  drawStations(interp, state);
}

boot();
