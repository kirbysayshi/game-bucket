import ScienceHalt from 'science-halt';
import {
  Integratable,
  Vector2,
  accelerate,
  add,
  copy,
  distance,
  inertia,
  set,
  solveDrag,
  translate,
  v2,
} from 'pocket-physics';
import { ViewportMan } from '../shared/viewport';
import { createGameLoop } from '../../loop';
import { listen, useRootElement } from '../../dom';
import { DrawDebugCamera } from '../shared/DebugDrawCamera';
import { debugDrawIntegratable } from '../../draw-utils';
import {
  ViewportUnitVector2,
  ViewportUnits,
  asViewportUnits,
  clearScreen,
  drawTextLinesInViewport,
  toProjectedPixels,
  toViewportUnits,
  vv2,
} from '../../components/ViewportCmp';
import { range } from '../shared/range';
import { makeMovementCmp } from '../../components/MovementCmp';
import { makeIntegratable } from '../shared/make-integratable';
import { YellowRGBA } from '../../theme';
import { setVelocity } from '../../phys-utils';
import { easeOutCirc } from '../../ease-out-circ';
import { isKeyDown } from '../../keys';

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

  constructor(private eman: EntityMan) {
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

class EntityMan<T extends Entity = Entity> {
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

class ParticleEntity extends Entity {
  movement = makeIntegratable();
  radius = asViewportUnits(1);
  private initialAge = 0;
  private age = 0;

  setLifespan(ms: number) {
    this.initialAge = ms;
    this.age = ms;
  }

  update(dt: number) {
    accelerate(this.movement, dt);
    inertia(this.movement);
    solveDrag(this.movement, 0.9);

    this.age -= dt;
    if (this.age <= 0) {
      this.destroy();
    }
  }

  draw(interp: number, vp: ViewportMan) {
    debugDrawIntegratable(
      vp.v,
      vp.v.dprCanvas.ctx,
      this.movement,
      interp,
      this.radius,
      easeOutCirc(this.age / this.initialAge, 0, 1, this.initialAge),
    );
  }
}

class ParticleBurst extends Entity {
  constructor(eman: EntityMan, pos: ViewportUnitVector2, count: number) {
    super(eman);
    for (let i = 0; i < count; i++) {
      const p = new ParticleEntity(eman);
      p.setLifespan(range(100, 300));
      copy(p.movement.cpos, pos);
      copy(p.movement.ppos, pos);
      set(p.movement.acel, range(-8, 8), range(-8, 8));
    }
  }

  update(dt: number): void {
    // immediately destroy self since particles have been emitted!
    this.destroy();
  }
}

class Ship extends Entity {
  movement = makeIntegratable();
  radius = asViewportUnits(2);
  rotation = 0;

  constructor(eman: EntityMan) {
    super(eman);
    translate(vv2(0, -20), this.movement.cpos, this.movement.ppos);
  }

  update(dt: number) {
    accelerate(this.movement, dt);
    inertia(this.movement);
    solveDrag(this.movement, 0.9);
  }

  draw(interp: number, vp: ViewportMan) {
    // TODO: rotation. either draw a nub or convert to a VerletBagEntity

    debugDrawIntegratable(
      vp.v,
      vp.v.dprCanvas.ctx,
      this.movement,
      interp,
      this.radius,
    );
  }

  translate(dir: 'forward' | 'back' | 'left' | 'right') {
    // TODO: rotate acel according to rotation

    const power = 0.5;
    let acel;
    if (dir === 'forward') acel = vv2(0, power);
    else if (dir === 'back') acel = vv2(0, -power);
    else if (dir === 'left') acel = vv2(-power, 0);
    else if (dir === 'right') acel = vv2(power, 0);
    else return;
    add(this.movement.acel, this.movement.acel, acel);
  }

  rotate(dir: 'left' | 'right') {
    const power = 0.1;
    let rot;
    if (dir === 'left') rot = -power;
    else if (dir === 'right') rot = power;
    else return;
    this.rotation += rot;
  }
}

class App implements Destroyable {
  eman = new EntityMan();

  stop = () => {};
  eventsOff = new AbortController();

  async boot() {
    const vp = new ViewportMan(useRootElement);
    const c1 = new Circle(this.eman);
    const t1 = new TextEntity(this.eman);
    t1.setText('Hello', vv2(50, 0), 30);
    t1.movement.acel.y = asViewportUnits(-1);
    const shaker = new ScreenShake(this.eman);
    const ship = new Ship(this.eman);
    const { stop } = createGameLoop({
      drawTime: 1000 / 60,
      updateTime: 1000 / 60,
      update: (dt) => {
        this.eman.update(dt);

        // keyboard controls
        isKeyDown('KeyW') && ship.translate('forward');
        isKeyDown('KeyS') && ship.translate('back');
        isKeyDown('KeyA') && ship.translate('left');
        isKeyDown('KeyD') && ship.translate('right');
        isKeyDown('KeyQ') && ship.rotate('left');
        isKeyDown('KeyE') && ship.rotate('right');
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
      'keydown',
      (ev) => {
        if (ev.key === 'ArrowRight') {
          vp.v.camera.target.x = (1 + vp.v.camera.target.x) as ViewportUnits;
        } else if (ev.key === 'ArrowLeft') {
          vp.v.camera.target.x = (-1 + vp.v.camera.target.x) as ViewportUnits;
        }
      },
      { signal: this.eventsOff.signal },
    );

    addEventListener(
      'click',
      (ev) => {
        // How to pick from screen space to world:

        // canvas/element space
        const rect = vp.v.dprCanvas.cvs.getBoundingClientRect();
        const cvsLocalX = ev.clientX - rect.left;
        const cvsLocalY = ev.clientY - rect.top;

        // vp space
        const vpLocalX = toViewportUnits(vp.v, cvsLocalX);
        const vpLocalY = toViewportUnits(vp.v, cvsLocalY);

        // camera space
        const vpFrustrumizedX = vpLocalX - vp.v.camera.frustrum.x;
        const vpFrustrumizedY = vpLocalY - vp.v.camera.frustrum.y;

        // world space
        const worldX = vp.v.camera.target.x + vpFrustrumizedX;
        const worldY = vp.v.camera.target.y - vpFrustrumizedY;

        const cameraSpace = vv2(vpFrustrumizedX, vpFrustrumizedY);
        const worldSpace = vv2(worldX, worldY);

        console.log(vp.v.camera.target, cameraSpace, worldSpace);

        // distance from center of screen (aka camera) to picked point
        const d = distance(cameraSpace, vv2(0, 0));

        // shake according to distance
        shaker.shake(d, 200, 0);

        // burst at mouse position in world
        const p0 = new ParticleBurst(this.eman, worldSpace, 10);
      },
      { signal: this.eventsOff.signal },
    );
  }

  async destroy() {
    this.stop();
  }
}
