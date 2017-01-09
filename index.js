import {
  default as Ces,
  systemPropReqs
} from './lib/ces';
import {
  schedule,
  tick,
} from './lib/time';
import Loop from './lib/loop';

import accelerate from 'pocket-physics/accelerate2d';
import inertia from 'pocket-physics/inertia2d';

const ces = new Ces();
const {
  newEntity: Entity,
  newSystem: System,
  destroyEntity,
} = ces;

// This is an "entity", aka a bag of data, with a special array named `tags`.
// These tags mark an entity as processable by a system that has matching tags.
// The system will only invoke its routine if an entity or entities has every
// tag the system requires.
const e1 = Entity({
  tags: ['phys-no-col', 'draw-console'],
  cpos: { x: 0, y: 0 },
  ppos: { x: 0, y: 0 },
  acel: { x: 10, y: 0 },
});

const physicsSystem = System((entities, dt) => {
  // entities is passed in at call time from within.
  // dt comes from calling the system manually below.
  entities.forEach(e => {
    // this will be removed during the build due to dead-code elimination.
    // Having this check will hopefully prevent typos during dev?
    if (process.env.NODE_ENV !== 'production') { systemPropReqs(e, 'cpos', 'ppos', 'acel'); }
    accelerate(e, dt);
    inertia(e);
  })
}, 'phys-no-col');

// this should be made more specific, such as "circleDraw" or "particleDraw" and should
// receive some sort of drawing context as param.
const drawSystem = System((entities, interp) => {
  // entities is passed in at call time from within.
  // interp comes from manually calling the system below.
  entities.forEach(e => {
    if (process.env.NODE_ENV !== 'production') { systemPropReqs(e, 'cpos', 'ppos'); }
    console.log('x', e.ppos.x + (e.cpos.x - e.ppos.x) * interp);
    console.log('y', e.ppos.y + (e.cpos.y - e.ppos.y) * interp);
  })
}, 'draw-console');


// schedule a callback for a specified "best effort" time in the future.
schedule((scheduledDelay, actualDelay) => {
  // destroy the entity after 3500 ms
  // TODO: may need a "destroyEntityXSystem" that deallocs any props on the
  // entity.
  destroyEntity(e1);
  console.log(e1);
}, 3500);

const { stop } = Loop({
  drawTime: 1000 / 60,
  updateTime: 1000 / 30,
  update: (dt) => {
    tick(dt);
    physicsSystem(dt);
  },
  draw: (interp) => {
    drawSystem(interp);
  },
  onPanic: () => console.log('panic!'),
  onFPS: (fps) => console.log(fps, 'fps'),
});

// Turn this into dead-code during production
if (process.env.NODE_ENV !== 'production') {
  window.addEventListener('keydown', e => {
    if (e.which === 27) {
      stop();
      console.log('HALT IN THE NAME OF SCIENCE');
    }
  }, false);
}
