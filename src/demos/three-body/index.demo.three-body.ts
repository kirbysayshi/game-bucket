import {
  Vector2,
  accelerate,
  copy,
  distance,
  inertia,
  set,
  solveDistanceConstraint,
  solveGravitation,
  sub,
  v2,
} from 'pocket-physics';
import ScienceHalt from 'science-halt';
import Fool from '../../../assets/00 - Fool.png';
import {
  ComponentInstanceHandle,
  ComponentManager,
  EntityId,
  EntityManager,
  Query,
  addComponent,
  createEntity,
  destroyComponentManager,
  lookup,
  read,
  registerComponentMan,
  removeComponent,
} from '../../ces5';
import { createGameLoop } from '../../loop';
import { DrawTimeHz, UpdateTimeHz } from '../../loopConstants';
import { ViewportMan } from './viewport';
import { useRootElement, useUIRoot } from '../../dom';
import { DrawDebugCamera } from './DebugDrawCamera';
import {
  asViewportUnits,
  clearScreen,
  moveViewportCamera,
  toViewportUnits,
  vv2,
} from '../../components/ViewportCmp';
import { debugDrawIntegratable } from '../../draw-utils';

let world: World | null = null;

export async function boot() {
  console.log('hello', Fool);
  world = new World();
  world.spawn();

  const { stop } = createGameLoop({
    drawTime: 1000 / DrawTimeHz,
    updateTime: 1000 / UpdateTimeHz,
    update: (dt) => {
      world?.update(1);
    },
    draw: (interp) => {
      world?.draw(interp);
    },
    onPanic,
    onFPS: (fps) => {
      // const data = ces.selectFirstData('fps')!;
      // data.v = fps;
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

export async function shutdown() {
  world?.shutdown();
  console.log('shutdown!', world);
}

class Phyman extends ComponentManager<{
  cpos: Vector2[];
  ppos: Vector2[];
  acel: Vector2[];
  mass: number[];
}> {
  get<T extends keyof Phyman['storage']>(
    eid: EntityId,
    k: T,
  ): NonNullable<Phyman['storage'][T]>[number] | null {
    const handle = lookup(this, eid);
    if (!handle) return null;
    return this.storage[k]?.[handle.storageIdx] ?? null;
  }
}

class World {
  vp = new ViewportMan(useRootElement);

  eman = new EntityManager();
  phyman = new Phyman();
  circleman = new ComponentManager<{
    radius: number[];
  }>();

  circlesQ = new Query([this.phyman, this.circleman]);

  draws: ((interp: number) => void)[] = [];

  shutdown() {
    this.circlesQ.destroy();
    destroyComponentManager(this.phyman, this.eman);
    destroyComponentManager(this.circleman, this.eman);
  }

  spawn() {
    registerComponentMan(this.eman, this.phyman, this.circleman);

    this.draws.push(
      () => clearScreen(this.vp.v),
      () => DrawDebugCamera()(this.vp),
    );

    moveViewportCamera(this.vp.v, vv2(0, 0));

    {
      const eid = createEntity(this.eman);
      addComponent(this.phyman, eid, {
        cpos: v2(25, 0),
        ppos: v2(25, 0),
        acel: v2(-500, -600),
        mass: 100,
      });
      addComponent(this.circleman, eid, {
        radius: 10,
      });
    }

    {
      const eid = createEntity(this.eman);
      addComponent(this.phyman, eid, {
        cpos: v2(-25, 0),
        ppos: v2(-25, 0),
        acel: v2(500, 100),
        mass: 100,
      });
      addComponent(this.circleman, eid, {
        radius: 10,
      });
    }

    {
      const eid = createEntity(this.eman);
      addComponent(this.phyman, eid, {
        cpos: v2(0, 25),
        ppos: v2(0, 25),
        acel: v2(-500, 0),
        mass: 100,
      });
      addComponent(this.circleman, eid, {
        radius: 10,
      });
    }
  }

  update(dt: number) {
    const phys1 = {
      cpos: v2(),
      ppos: v2(),
      acel: v2(),
      mass: v2(),
    };

    const phys2 = {
      cpos: v2(),
      ppos: v2(),
      acel: v2(),
      mass: v2(),
    };

    const entities = Array.from(this.circlesQ.entities);

    for (let i = 0; i < entities.length; i++) {
      const eid1 = entities[i];

      const cpos1 = read(this.phyman, eid1, 'cpos');
      const ppos1 = read(this.phyman, eid1, 'ppos');
      const acel1 = read(this.phyman, eid1, 'acel');
      const mass1 = read(this.phyman, eid1, 'mass');

      if (!cpos1 || !ppos1 || !acel1 || !mass1) continue;

      copy(phys1.cpos, cpos1);
      copy(phys1.ppos, ppos1);
      copy(phys1.acel, acel1);

      for (let j = i + 1; j < entities.length; j++) {
        const eid2 = entities[j];
        const cpos2 = read(this.phyman, eid2, 'cpos');
        const ppos2 = read(this.phyman, eid2, 'ppos');
        const acel2 = read(this.phyman, eid2, 'acel');
        const mass2 = read(this.phyman, eid2, 'mass');
        if (!cpos2 || !ppos2 || !acel2 || !mass2) continue;

        copy(phys2.cpos, cpos2);
        copy(phys2.ppos, ppos2);
        copy(phys2.acel, acel2);

        solveGravitation(phys1, mass1, phys2, mass2);
        solveGravitation(phys2, mass2, phys1, mass1);

        const d = distance(phys1.cpos, phys2.cpos);
        const minDist = 20;
        if (d < minDist)
          solveDistanceConstraint(
            phys1,
            mass1,
            phys2,
            mass2,
            minDist,
            0.1,
            false,
          );

        copy(cpos1, phys1.cpos);
        copy(ppos1, phys1.ppos);
        copy(acel1, phys1.acel);

        copy(cpos2, phys2.cpos);
        copy(ppos2, phys2.ppos);
        copy(acel2, phys2.acel);
      }

      accelerate(phys1, dt);
      inertia(phys1);

      copy(cpos1, phys1.cpos);
      copy(ppos1, phys1.ppos);
      copy(acel1, phys1.acel);
    }
  }

  draw(interp: number) {
    this.draws.forEach((draw) => draw(interp));

    const pos = v2();
    this.circlesQ.entities.forEach((eid) => {
      const cpos = read(this.phyman, eid, 'cpos');
      const ppos = read(this.phyman, eid, 'ppos');
      const radius = read(this.circleman, eid, 'radius');
      if (!cpos || !ppos || !radius) return;
      sub(pos, cpos, ppos);

      debugDrawIntegratable(
        this.vp.v,
        this.vp.v.dprCanvas.ctx,
        { cpos, ppos },
        interp,
        toViewportUnits(this.vp.v, radius),
      );
    });
  }
}
