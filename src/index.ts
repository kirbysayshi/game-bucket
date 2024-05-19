import ScienceHalt from 'science-halt';
import { Assets } from './asset-map';
import { makeGameCmp } from './components/GameCmp';
import { DrawTimeHz, UpdateTimeHz } from './loopConstants';
import {
  computeWindowResize,
  initializeResize as initializeWindowResizeListener,
  moveViewportCamera,
  vv2,
} from './components/ViewportCmp';
import { initializeCES } from './initialize-ces';
import { createGameLoop } from './loop';
import { tick } from './time';
import { showUIControls, syncCss, wireUI } from './ui';
import { assertDefinedFatal } from './utils';

async function boot() {
  // TODO: consider putting `assets` loading as a game state (boot?)?
  const assets = new Assets();
  await assets.preload();

  // initialize persistent component-entity-system
  const ces = initializeCES();

  // create the initial viewport and sizing
  initializeWindowResizeListener(ces);
  computeWindowResize(ces);

  // For a good example of touch + keyboard input, see
  // https://github.com/kirbysayshi/js13k-2020/blob/master/src/ui.ts

  // Make the global "game state" that manages various global structures
  const g = makeGameCmp(assets);
  ces.entity([g]);

  {
    // Move the camera so the origin is at the bottom left corner
    const vp = ces.selectFirstData('viewport');
    assertDefinedFatal(vp);
    moveViewportCamera(vp, vv2(vp.vpWidth / 2, vp.camera.frustrum.y));
  }

  {
    // fps entity for monitoring framerate
    ces.entity([{ k: 'fps', v: 60 }]);
  }

  {
    const vp = ces.selectFirstData('viewport');
    assertDefinedFatal(vp);
    syncCss(vp);
    showUIControls();
    wireUI();
  }

  const { stop } = createGameLoop({
    drawTime: 1000 / DrawTimeHz,
    updateTime: 1000 / UpdateTimeHz,
    update: (dt) => {
      // Increment scheduled actions.
      tick(dt);

      // Update all the "update" systems
      g.updateStepSystems.forEach((s) => s(ces, dt));

      // Manually update the primary "game loop". This is a separate system to
      // allow it to manipulate the update/draw systems arrays without needing
      // to worry about itself.
      g.gameTickSystem(ces, dt);

      // Actualy destroy any entities that were marked for destruction. We do
      // this at the end of the update step to avoid race conditions between
      // systems.
      ces.flushDestruction();
    },
    draw: (interp) => {
      // `interp` is a value between 0 and 1 that determines how close we are
      // to the next `update` frame. This allows for smooth animation, even
      // though the actual root values change less frequently than we draw.
      g.drawStepSystems.forEach((s) => s(ces, interp));
    },
    onPanic,
    onFPS: (fps) => {
      const data = ces.selectFirstData('fps')!;
      data.v = fps;
    },
  });

  // Turn into dead-code during minification via NODE_ENV check.
  if (process.env.NODE_ENV !== 'production') {
    ScienceHalt(() => stop());
  }
}

function onPanic() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('panic!');
  }
}

boot();
