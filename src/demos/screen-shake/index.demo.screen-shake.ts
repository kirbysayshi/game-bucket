import { Integratable, Vector2, sub, v2 } from 'pocket-physics';
import ScienceHalt from 'science-halt';
import {
  ComponentManager,
  EntityManager,
  Query,
  addComponent,
  createEntity,
  destroyComponentManager,
  firstEntity,
  read,
  registerComponentMan,
} from '../../ces5';
import {
  clearScreen,
  drawTextLinesInViewport,
  toViewportUnits,
  vv2,
} from '../../components/ViewportCmp';
import { useRootElement } from '../../dom';
import { createGameLoop } from '../../loop';
import { DrawTimeHz, UpdateTimeHz } from '../../loopConstants';
import { ViewportMan } from '../shared/viewport';
import { getRandom } from '../../rng';
import { range } from './range';
import { debugDrawIntegratable } from '../../draw-utils';
import { DrawDebugCamera } from '../shared/DebugDrawCamera';
import { YellowRGBA } from '../../theme';

let game: Game | null = null;

export async function boot() {
  game = new Game();
  game.start();
}

export async function shutdown() {
  game?.stop();
}

class Game {
  eman = new EntityManager();

  screenShake = new ScreenShakeSystem(this.eman);

  circleman = new ComponentManager<{
    radius: number[];
  }>();

  phyman = new ComponentManager<{
    vint: (Integratable & { mass: number })[];
  }>();

  circlesQ = new Query([this.phyman, this.circleman]);

  vp = new ViewportMan(useRootElement);

  stopLoop: () => void = () => {};
  eventsOff = new AbortController();

  start() {
    {
      const eid = createEntity(this.eman);
      addComponent(this.phyman, eid, {
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
      },
      draw: (interp) => {
        clearScreen(this.vp.v);

        {
          const data = this.screenShake.info();
          if (data) {
            this.vp.v.dprCanvas.ctx.translate(data.offset.x, data.offset.y);
            this.vp.v.dprCanvas.ctx.rotate(data.rotation);
          }
        }

        DrawDebugCamera()(this.vp);
        {
          const eid = firstEntity(this.circleman);
          const vint = read(this.phyman, eid, 'vint');
          const radius = read(this.circleman, eid, 'radius');
          if (vint && radius) {
            debugDrawIntegratable(
              this.vp.v,
              this.vp.v.dprCanvas.ctx,
              vint,
              interp,
              toViewportUnits(this.vp.v, radius),
            );
          }
        }

        drawTextLinesInViewport(
          this.vp.v,
          'Hello',
          vv2(50, 0),
          'center',
          30,
          YellowRGBA,
        );

        {
          const data = this.screenShake.info();
          if (data) {
            this.vp.v.dprCanvas.ctx.rotate(-data.rotation);
            this.vp.v.dprCanvas.ctx.translate(-data.offset.x, -data.offset.y);
          }
        }
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
    const eid = firstEntity(this.screenShakeMan);
    if (eid) {
      const output = read(this.screenShakeMan, eid, 'output');
      const initial = read(this.screenShakeMan, eid, 'initial');
      if (!output || !initial) return;
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
