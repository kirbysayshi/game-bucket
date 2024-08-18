import {
  Integratable,
  Vector2,
  VelocityDerivable,
  accelerate,
  inertia,
  sub,
  v2,
} from 'pocket-physics';
import ScienceHalt from 'science-halt';
import {
  ComponentManager,
  EntityId,
  EntityManager,
  Query,
  addComponent,
  createEntity,
  destroyComponentManager,
  firstEntity,
  read,
  registerComponentMan,
} from '../../ces5';
import { useRootElement } from '../../dom';
import { createGameLoop } from '../../loop';
import { DrawTimeHz, UpdateTimeHz } from '../../loopConstants';
import { CanvasCameraMan } from '../shared/CameraCanvasMan';
import { getRandom } from '../../rng';
import { range } from '../shared/range';
import { DrawDebugCamera } from '../shared/DrawDebugCamera';
import { YellowRGBA } from '../../theme';
import {
  asPixels,
  asWorldUnits,
  drawCameraText,
  WorldUnits,
} from '../shared/Camera2d';

let game: Game | null = null;

export async function boot() {
  game = new Game();
  game.start();
}

export async function shutdown() {
  game?.stop();
}

type CircleCmpStorage = { radius: number[] };
type PhyCmpStorage = {
  vint: (Integratable & { mass: number })[];
};

class Game {
  eman = new EntityManager();

  screenShake = new ScreenShakeSystem(this.eman);
  movement = new MovementSystem(this.eman);

  circleman = new ComponentManager<CircleCmpStorage>();
  // phyman = new ComponentManager<PhyCmpStorage>();

  circlesQ = new Query([this.movement.phyman, this.circleman]);

  vp = new CanvasCameraMan(useRootElement);

  stopLoop: () => void = () => {};
  eventsOff = new AbortController();

  start() {
    {
      const eid = createEntity(this.eman);
      addComponent(this.movement.phyman, eid, {
        vint: {
          cpos: v2(0, 0),
          ppos: v2(0, 0),
          acel: v2(0, 0),
          mass: 100,
        },
      });
      addComponent(this.circleman, eid, {
        radius: 10,
      });
    }

    addEventListener(
      'click',
      () => {
        this.screenShake.shake(5, 200, Math.PI / 8);
      },
      { signal: this.eventsOff.signal },
    );

    const { stop } = createGameLoop({
      drawTime: 1000 / DrawTimeHz,
      updateTime: 1000 / UpdateTimeHz,
      update: (dt) => {
        this.screenShake.update(dt);
        this.movement.update(dt);

        for (const circle of this.circlesQ.entities) {
          const vint = this.movement.integratable(circle);
          if (!vint) continue;
          vint.acel.x += range(-0.01, 0.01);
          vint.acel.y += range(-0.01, 0.01);
        }
      },
      draw: (interp) => {
        const ctx = this.vp.ctx;

        ctx.clearRect(0, 0, this.vp.width, this.vp.height);

        ctx.save();
        this.vp.camera.applyToContext(
          ctx,
          asPixels(this.vp.width),
          asPixels(this.vp.height),
        );

        {
          const data = this.screenShake.info();
          if (data) {
            this.vp.ctx.translate(data.offset.x, data.offset.y);
            this.vp.ctx.rotate(data.rotation);
          }
        }

        {
          const eid = firstEntity(this.circleman);
          const vint = this.movement.integratable(eid);
          const radius = read(this.circleman, eid, 'radius');
          if (vint && radius) {
            debugDrawIntegratable(
              this.vp.ctx,
              vint,
              interp,
              asWorldUnits(radius),
            );
          }
        }

        drawCameraText(
          this.vp.ctx,
          this.vp.camera,
          asPixels(this.vp.height),
          'Hello',
          // TODO: this "looks" correct visually, but is it actually?
          asPixels(this.vp.canvasElement.width / 2),
          asPixels(0),
          20,
          (ctx, fontSizePx) => {
            ctx.font = `${fontSizePx}px sans-serif`;
            ctx.fillStyle = YellowRGBA;
            ctx.textAlign = 'center';
          },
        );

        {
          const data = this.screenShake.info();
          if (data) {
            this.vp.ctx.rotate(-data.rotation);
            this.vp.ctx.translate(-data.offset.x, -data.offset.y);
          }
        }

        ctx.restore();
      },
      onPanic() {
        if (process.env.NODE_ENV !== 'production') {
          console.log('panic!');
        }
      },
      onFPS: (fps) => {
        // const data = ces.selectFirstData('fps')!;
        // data.v = fps;
      },
    });

    this.stopLoop = stop;

    if (process.env.NODE_ENV !== 'production') {
      ScienceHalt(() => this.stop());
    }
  }

  stop() {
    this.stopLoop();
    this.screenShake.destroy();
    this.eventsOff.abort();
  }
}

interface Updatable {
  update(dt: number): void;
}

interface Destroyable {
  destroy(): void;
}

class MovementSystem implements Updatable, Destroyable {
  phyman = new ComponentManager<PhyCmpStorage>();

  constructor(private eman: EntityManager) {}

  update(dt: number) {
    if (!this.phyman.storage.vint) return;
    for (let i = 0; i < this.phyman.storage.vint.length; i++) {
      const vint = this.phyman.storage.vint[i];
      accelerate(vint, dt);
      inertia(vint);
    }
  }

  destroy() {
    destroyComponentManager(this.phyman, this.eman);
  }

  integratable(eid: EntityId | null | undefined) {
    if (!eid) return;
    const vint = read(this.phyman, eid, 'vint');
    if (!vint) return;
    return vint;
  }
}

class ScreenShakeSystem implements Updatable, Destroyable {
  screenShakeMan = new ComponentManager<{
    output: {
      offset: Vector2;
      rotation: number;
    }[];

    initial: {
      strength: number;
      rotation: number;
      durationMs: number;
    }[];
  }>();

  constructor(private eman: EntityManager) {
    registerComponentMan(this.eman, this.screenShakeMan);

    const eid = createEntity(this.eman);
    addComponent(this.screenShakeMan, eid, {
      initial: {
        strength: 0,
        rotation: 0,
        durationMs: 0,
      },
      output: {
        offset: v2(),
        rotation: 0,
      },
    });
  }

  destroy() {
    destroyComponentManager(this.screenShakeMan, this.eman);
  }

  update(dt: number) {
    if (
      !this.screenShakeMan.storage.initial ||
      !this.screenShakeMan.storage.output
    )
      return;

    for (let i = 0; i < this.screenShakeMan.storage.initial.length; i++) {
      const initial = this.screenShakeMan.storage.initial[i];
      const output = this.screenShakeMan.storage.output[i];
      output.offset.x = range(-initial.strength, initial.strength);
      output.offset.y = range(-initial.strength, initial.strength);
      output.rotation = range(-initial.rotation, initial.rotation);
      initial.durationMs = Math.max(initial.durationMs - dt, 0);
      if (initial.durationMs === 0) {
        initial.strength = 0;
        initial.rotation = 0;
        output.offset.x = 0;
        output.offset.y = 0;
        output.rotation = 0;
      }
    }
  }

  shake(strength: number, durationMs: number, rotation: number = 0) {
    const eid = firstEntity(this.screenShakeMan);
    if (!eid) return;
    const initial = read(this.screenShakeMan, eid, 'initial');
    if (!initial) return;
    initial.strength = strength;
    initial.rotation = rotation;
    initial.durationMs = durationMs;
  }

  info() {
    const eid = firstEntity(this.screenShakeMan);
    const data = eid ? read(this.screenShakeMan, eid, 'output') : null;
    return data;
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
