import ScienceHalt from "science-halt";
import accelerate from "pocket-physics/accelerate2d";
import inertia from "pocket-physics/inertia2d";

import { CES } from "./ces";
import { schedule, tick } from "./time";
import { Loop } from "./loop";

import TestPng from "../assets/00 - Fool.png";
console.log(TestPng);

type MovementCmp = {
  k: "v-movement";
  cpos: { x: number; y: number };
  ppos: { x: number; y: number };
  acel: { x: number; y: number };
};

type DrawConsoleCmp = {
  k: "draw-console";
};

type Component = MovementCmp | DrawConsoleCmp;

// A component=entity-system(s) is a pattern for managing the lifecycles and
// structures of differently structured data. It can be thought of as a
// document database. Each entity (document) has a numeric id. Specific
// fields and combinations of fields across the entire Store can be queried
// by `select`ing those fields, as seen below.
const ces = new CES<Component>();

// An entity is just a numeric ID with associated "tagged" data denoted by
// property 'k'. The unique names give to 'k' allow us to lookup that data
// and modify it.
const e1 = ces.entity([
  {
    k: "v-movement",
    cpos: { x: 0, y: 0 },
    ppos: { x: 0, y: 0 },
    acel: { x: 10, y: 0 }
  },
  { k: "draw-console" }
]);

// A system of an entity-component-system framework is simply a function that
// is repeatedly called. We separate them into two types based on how often
// they are invoked: every frame or once every update step (10fps by default).
const drawStepSystems: ((ces: CES<Component>, interp: number) => void)[] = [];
const updateStepSystems: ((ces: CES<Component>, dt: number) => void)[] = [];

// Physics "system", updated at 10fps
updateStepSystems.push(function(ces: CES<Component>, dt: number) {
  const entities = ces.select(["v-movement"]);
  entities.forEach(e => {
    const cmp = ces.data(e, "v-movement");
    accelerate(cmp, dt);
    inertia(cmp);
  });
});

// Draw "system" updated at 60fps
drawStepSystems.push(function(ces: CES<Component>, interp: number) {
  const entities = ces.select(["v-movement", "draw-console"]);
  entities.forEach(e => {
    const cmp = ces.data(e, "v-movement");
    console.log("x", cmp.ppos.x + (cmp.cpos.x - cmp.ppos.x) * interp);
    console.log("y", cmp.ppos.y + (cmp.cpos.y - cmp.ppos.y) * interp);
  });
});


// schedule a callback for a specified "best effort" time in the future.
schedule((scheduledDelay, actualDelay) => {
  // destroy the entity after 3500 ms
  ces.destroy(e1);
  console.log("marked entity for destruction", e1);
}, 3500);

const { stop } = Loop({
  drawTime: 1000 / 60,
  updateTime: 1000 / 30,
  update: dt => {
    // Increment scheduled actions.
    tick(dt);

    // Update all the "update" systems
    updateStepSystems.forEach(s => s(ces, dt));

    // Actualy destroy any entities that were marked for destruction. We do
    // this at the end of the update step to avoid race conditions between
    // systems.
    ces.flushDestruction();
  },
  draw: interp => {
    // `interp` is a value between 0 and 1 that determines how close we are
    // to the next `update` frame. This allows for smooth animation, even
    // though the actual root values change less frequently than we draw.
    drawStepSystems.forEach(s => s(ces, interp));
  },
  onPanic: () => console.log("panic!"),
  onFPS: fps => console.log(fps, "fps")
});

// Turn into dead-code during minification via NODE_ENV check.
if (process.env.NODE_ENV !== "production") {
  ScienceHalt(() => stop());
}
