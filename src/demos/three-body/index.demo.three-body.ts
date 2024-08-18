import {
  Integratable,
  VelocityDerivable,
  accelerate,
  distance,
  inertia,
  solveDistanceConstraint,
  solveGravitation,
  sub,
  v2,
} from 'pocket-physics';
import ScienceHalt from 'science-halt';
import Fool from '../../../assets/00 - Fool.png';
import {
  ComponentManager,
  EntityManager,
  Query,
  addComponent,
  createEntity,
  destroyComponentManager,
  read,
  registerComponentMan,
} from '../../ces5';
import { createGameLoop } from '../../loop';
import { DrawTimeHz, UpdateTimeHz } from '../../loopConstants';
import { CanvasCameraMan } from '../shared/CameraCanvasMan';
import { useRootElement } from '../../dom';
import { asPixels, asWorldUnits, WorldUnits } from '../shared/Camera2d';

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
  vint: (Integratable & { mass: number })[];
}> {}

class World {
  vp = new CanvasCameraMan(useRootElement);
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
      () => this.vp.clear(),
      () => this.vp.applyCamera(),
      // () => DrawDebugCamera()(this.vp),
    );

    this.vp.camera.move(asWorldUnits(0), asWorldUnits(0));

    {
      const eid = createEntity(this.eman);
      addComponent(this.phyman, eid, {
        vint: {
          cpos: v2(25, 0),
          ppos: v2(25, 0),
          acel: v2(-500, -600),
          mass: 100,
        },
      });
      addComponent(this.circleman, eid, {
        radius: 10,
      });
    }

    {
      const eid = createEntity(this.eman);
      addComponent(this.phyman, eid, {
        vint: {
          cpos: v2(-25, 0),
          ppos: v2(-25, 0),
          acel: v2(500, 100),
          mass: 100,
        },
      });
      addComponent(this.circleman, eid, {
        radius: 1,
      });
    }

    {
      const eid = createEntity(this.eman);
      addComponent(this.phyman, eid, {
        vint: {
          cpos: v2(0, 25),
          ppos: v2(0, 25),
          acel: v2(-500, 0),
          mass: 100,
        },
      });
      addComponent(this.circleman, eid, {
        radius: 1,
      });
    }
  }

  update(dt: number) {
    const entities = Array.from(this.circlesQ.entities);

    for (let i = 0; i < entities.length; i++) {
      const eid1 = entities[i];

      const vint1 = read(this.phyman, eid1, 'vint');
      if (!vint1) continue;

      for (let j = i + 1; j < entities.length; j++) {
        const eid2 = entities[j];
        const vint2 = read(this.phyman, eid2, 'vint');
        if (!vint2) continue;

        solveGravitation(vint1, vint1.mass, vint2, vint2.mass);
        solveGravitation(vint2, vint2.mass, vint1, vint1.mass);

        const d = distance(vint1.cpos, vint2.cpos);
        const minDist = 20;
        if (d < minDist)
          solveDistanceConstraint(
            vint1,
            vint1.mass,
            vint2,
            vint2.mass,
            minDist,
            0.1,
            false,
          );
      }

      accelerate(vint1, dt);
      inertia(vint1);
    }
  }

  draw(interp: number) {
    this.vp.ctx.save();
    this.draws.forEach((draw) => draw(interp));

    const pos = v2();
    this.circlesQ.entities.forEach((eid) => {
      const vint = read(this.phyman, eid, 'vint');
      const radius = read(this.circleman, eid, 'radius');
      if (!vint || !radius) return;
      sub(pos, vint.cpos, vint.ppos);

      debugDrawIntegratable(this.vp.ctx, vint, interp, asWorldUnits(radius));
    });

    this.vp.ctx.restore();
  }
}

export function debugDrawIntegratable(
  ctx: CanvasRenderingContext2D,
  cmp: VelocityDerivable,
  interp: number,
  radius: WorldUnits = asWorldUnits(1),
  opacity: number = 0.2,
) {
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = `rgba(0,0,255,${opacity})`;
  ctx.arc(
    cmp.ppos.x + (cmp.cpos.x - cmp.ppos.x) * interp,
    cmp.ppos.y + (cmp.cpos.y - cmp.ppos.y) * interp,
    radius,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.restore();
}
