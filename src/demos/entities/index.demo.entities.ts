import ScienceHalt from 'science-halt';
import {
  Integratable,
  Vector2,
  accelerate,
  copy,
  inertia,
  set,
  v2,
} from 'pocket-physics';
import { ViewportMan } from '../shared/viewport';
import { createGameLoop } from '../../loop';
import { useRootElement } from '../../dom';
import { DrawDebugCamera } from '../shared/DebugDrawCamera';
import { debugDrawIntegratable } from '../../draw-utils';
import {
  ViewportUnitVector2,
  asViewportUnits,
  clearScreen,
  drawTextLinesInViewport,
  toViewportUnits,
  vv2,
} from '../../components/ViewportCmp';
import { range } from '../shared/range';
import { makeMovementCmp } from '../../components/MovementCmp';
import { makeIntegratable } from '../shared/make-integratable';
import { YellowRGBA } from '../../theme';

let app: App | null = null;

export async function boot() {
  app = new App();
  app.boot();
}

export async function shutdown() {
  app?.destroy();
}

type EntityId = { id: number; owned: boolean; destroyed: boolean };

class EntityIdMan {
  private lastId = 0;
  private entityIds: EntityId[] = [];

  createEntityId() {
    const id = ++this.lastId;
    const e = { id, owned: true, destroyed: false };
    this.entityIds.push(e);
    return e;
  }

  destroyEntityId(eid: EntityId) {
    eid.destroyed = true;
    const idx = this.entityIds.findIndex((e) => e.id === eid.id);
    if (idx === -1) return;
    // TODO: consider the swap trick, depending on whether there is display list
    // sorting
    this.entityIds.splice(idx, 1);
  }

  destroy() {
    for (const e of this.entityIds) {
      this.destroyEntityId(e);
    }
  }
}

interface Updatable {
  update?(dt: number): void;
}

interface Destroyable {
  destroy?(): void;
}

interface Drawable {
  draw?(interp: number, vp: ViewportMan): void;
}

interface Initable {
  init?(): void;
}

interface Entity {
  update?(dt: number): void;
  draw?(interp: number, vp: ViewportMan): void;
}

abstract class Entity implements Updatable, Destroyable, Drawable, Initable {
  id;

  constructor(private eman: Eman) {
    this.id = eman.eidman.createEntityId();
    eman.register(this);
    this.init();
  }

  destroy() {
    this.eman.eidman.destroyEntityId(this.id);
    this.eman.unregister(this);
  }

  init(): this {
    return this;
  }
}

class Eman<T extends Entity = Entity> {
  private entities: T[] = [];

  eidman = new EntityIdMan();

  register(entity: T) {
    this.entities.push(entity);
  }

  unregister(entity: T) {
    const idx = this.entities.indexOf(entity);
    if (idx === -1) return;
    this.entities.splice(idx, 1);
  }

  update(dt: number) {
    for (const e of this.entities) {
      e.update?.(dt);
    }
  }

  draw(interp: number, vp: ViewportMan) {
    for (const e of this.entities) {
      e.draw?.(interp, vp);
    }
  }
}

class Circle extends Entity {
  movement: Integratable = makeIntegratable();
  radius = asViewportUnits(10);

  update(dt: number) {
    accelerate(this.movement, dt);
    inertia(this.movement);
  }

  draw(interp: number, vp: ViewportMan) {
    debugDrawIntegratable(
      vp.v,
      vp.v.dprCanvas.ctx,
      this.movement,
      interp,
      this.radius,
    );
  }
}

class ScreenShake extends Entity {
  strength = 0;
  durationMs = 0;
  angle = 0;

  offset = v2();
  rotation = 0;

  shake(stength: number, durationMs: number, angle: number) {
    this.strength = stength;
    this.durationMs = durationMs;
    this.angle = angle;

    setTimeout(() => {
      this.offset = { x: 0, y: 0 };
      this.rotation = 0;
    }, durationMs);
  }

  update(dt: number) {
    this.offset.x = range(-this.strength, this.strength);
    this.offset.y = range(-this.strength, this.strength);
    this.rotation = range(-this.angle, this.angle);
    this.durationMs = Math.max(this.durationMs - dt, 0);
    if (this.durationMs <= 0) {
      set(this.offset, 0, 0);
      this.rotation = 0;
    }
  }

  specialDraw(interp: number, vp: ViewportMan, stage: 'before' | 'after') {
    if (stage === 'before') {
      vp.v.dprCanvas.ctx.translate(this.offset.x, this.offset.y);
      vp.v.dprCanvas.ctx.rotate(this.rotation);
    } else {
      vp.v.dprCanvas.ctx.rotate(-this.rotation);
      vp.v.dprCanvas.ctx.translate(-this.offset.x, -this.offset.y);
    }
  }
}

class TextEntity extends Entity {
  text = '';
  sizeInViewportLines = 30;

  movement = makeIntegratable();

  setText(text: string, pos: ViewportUnitVector2, sizeInViewportLines: number) {
    this.text = text;
    copy(this.movement.cpos, pos);
    copy(this.movement.ppos, pos);
    this.sizeInViewportLines = sizeInViewportLines;
  }

  update(dt: number) {
    accelerate(this.movement, dt);
    inertia(this.movement);
  }

  draw(interp: number, vp: ViewportMan) {
    drawTextLinesInViewport(
      vp.v,
      this.text,
      this.movement.cpos,
      'center',
      this.sizeInViewportLines,
      YellowRGBA,
    );
  }
}

class App implements Destroyable {
  eman = new Eman();

  stop = () => {};
  eventsOff = new AbortController();

  async boot() {
    const vp = new ViewportMan(useRootElement);
    const c1 = new Circle(this.eman);
    const t1 = new TextEntity(this.eman);
    t1.setText('Hello', vv2(50, 0), 30);
    t1.movement.acel.y = asViewportUnits(-1);
    const shaker = new ScreenShake(this.eman);
    const { stop } = createGameLoop({
      drawTime: 1000 / 60,
      updateTime: 1000 / 60,
      update: (dt) => {
        this.eman.update(dt);
      },
      draw: (interp) => {
        clearScreen(vp.v);
        shaker.specialDraw(interp, vp, 'before');
        this.eman.draw(interp, vp);
        DrawDebugCamera()(vp);
        shaker.specialDraw(interp, vp, 'after');
      },
    });
    this.stop = stop;

    if (process.env.NODE_ENV !== 'production') {
      ScienceHalt(() => this.destroy());
    }

    addEventListener(
      'click',
      () => {
        shaker.shake(5, 200, Math.PI / 8);
      },
      { signal: this.eventsOff.signal },
    );
  }

  async destroy() {
    this.stop();
  }
}
