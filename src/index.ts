import { accelerate, inertia } from 'pocket-physics';
import ScienceHalt from 'science-halt';
import TestPng from '../assets/00 - Fool.png';
import { AssetMap } from './asset-map';
import {
  DrawStepSystem,
  DrawTimeHz,
  UpdateStepSystem,
  UpdateTimeHz,
  useCES,
} from './components';
import { initDragListeners } from './drag';
import { createGameLoop } from './loop';
import { schedule, tick } from './time';
import { computeWindowResize, drawAsset, vv2 } from './viewport';

console.log(TestPng);

async function boot() {
  const assets = new AssetMap();
  await assets.preload();

  // A component=entity-system(s) is a pattern for managing the lifecycles and
  // structures of differently structured data. It can be thought of as a
  // document database. Each entity (document) has a numeric id. Specific
  // fields and combinations of fields across the entire Store can be queried
  // by `select`ing those fields, as seen below.
  const ces = useCES();

  // create the initial viewport and sizing
  computeWindowResize();

  // initialize touch: look at js13k-2019 for how to use (pointer-target, etc)
  initDragListeners();

  // An entity is just a numeric ID with associated "tagged" data denoted by
  // property 'k'. The unique names give to 'k' allow us to lookup that data
  // and modify it.
  const e1 = ces.entity([
    {
      k: 'v-movement',
      cpos: vv2(0, 0),
      ppos: vv2(0, 0),
      acel: vv2(10, 0),
    },
    { k: 'draw-console' },
  ]);

  // A system of an entity-component-system framework is simply a function that
  // is repeatedly called. We separate them into two types based on how often
  // they are invoked: every frame or once every update step (10fps by default).
  const drawStepSystems: DrawStepSystem[] = [];
  const updateStepSystems: UpdateStepSystem[] = [];

  // Physics "system", updated at 10fps
  updateStepSystems.push(function (ces, dt) {
    const entities = ces.select(['v-movement']);
    entities.forEach((e) => {
      const cmp = ces.data(e, 'v-movement');
      if (!cmp) return;
      accelerate(cmp, dt);
      inertia(cmp);
    });
  });

  // clear the screen at 60fps
  drawStepSystems.push((ces) => {
    const screen = ces.selectFirstData('viewport')!;
    screen.dprCanvas.ctx.clearRect(
      0,
      0,
      screen.dprCanvas.cvs.width,
      screen.dprCanvas.cvs.height
    );
  });

  // Draw "system" updated at 60fps
  drawStepSystems.push(function (ces, interp) {
    const bg = assets.getImage('test');
    const screen = ces.selectFirstData('viewport')!;
    drawAsset(
      bg,
      interp,
      vv2(0, 0),
      vv2(0, 0),
      screen.vpWidth,
      screen.vpHeight
    );
  });

  // "draw" the position of this object to the console at 60fps
  drawStepSystems.push(function (ces, interp) {
    const entities = ces.select(['v-movement', 'draw-console']);
    entities.forEach((e) => {
      const cmp = ces.data(e, 'v-movement');
      if (!cmp) return;
      console.log('x', cmp.ppos.x + (cmp.cpos.x - cmp.ppos.x) * interp);
      console.log('y', cmp.ppos.y + (cmp.cpos.y - cmp.ppos.y) * interp);
    });
  });

  // fps entity
  ces.entity([{ k: 'fps', v: 60 }]);

  // Draw the FPS as text on the canvas
  drawStepSystems.push((ces) => {
    const screen = ces.selectFirstData('viewport')!;
    const fpsData = ces.selectFirstData('fps')!;
    const text = fpsData.v.toFixed(2);
    // How many lines of text do we want to be able to display on canvas?
    // Ok, use that as the font size. This assumes the canvas size _ratio_ is fixed but
    // the actual pixel dimensions are not.
    // TODO: The canvas size is currently a fixed ratio, but different physical sizes
    // depending on the screen in order to have crisp pixels regardless. This means all
    // layout must be relative units. This might be a huge problem / difficulty...
    const maxLinesPerCanvas = 44;
    const textSize = screen.height / maxLinesPerCanvas;
    const lineHeight = 1.5;
    screen.dprCanvas.ctx.font = `${textSize}/${lineHeight} monospace`;
    const measure = screen.dprCanvas.ctx.measureText(text);
    const width = measure.width + 1;
    // fillText uses textBaseline as coordinates. "alphabetic" textBaseline is default,
    // so we attempt to compensate by subtracting the text size.
    // For example, drawing "g" at 0,0 will result in only the decender showing on the
    // canvas! We could change the baseline, but then text blocks / paragraphs would be
    // hard to read.
    const height = textSize * lineHeight - textSize;
    screen.dprCanvas.ctx.fillStyle = 'rgba(255,255,0,1)';
    screen.dprCanvas.ctx.fillText(
      text,
      screen.width - width,
      screen.height - height
    );
  });

  // schedule a callback for a specified "best effort" time in the future.
  schedule((scheduledDelay, actualDelay) => {
    // destroy the entity after 3500 ms
    ces.destroy(e1);
    console.log('marked entity for destruction', e1);
  }, 3500);

  const { stop } = createGameLoop({
    drawTime: 1000 / DrawTimeHz,
    updateTime: 1000 / UpdateTimeHz,
    update: (dt) => {
      // Increment scheduled actions.
      tick(dt);

      // Update all the "update" systems
      updateStepSystems.forEach((s) => s(ces, dt));

      // Actualy destroy any entities that were marked for destruction. We do
      // this at the end of the update step to avoid race conditions between
      // systems.
      ces.flushDestruction();
    },
    draw: (interp) => {
      // `interp` is a value between 0 and 1 that determines how close we are
      // to the next `update` frame. This allows for smooth animation, even
      // though the actual root values change less frequently than we draw.
      drawStepSystems.forEach((s) => s(ces, interp));
    },
    onPanic,
    onFPS,
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

function onFPS(fps: number) {
  const ces = useCES();
  const data = ces.selectFirstData('fps')!;
  data.v = fps;
}

boot();
