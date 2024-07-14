import ScienceHalt from 'science-halt';
import {
  Integratable,
  Vector2,
  VelocityDerivable,
  accelerate,
  add,
  copy,
  distance,
  inertia,
  rotate2d,
  set,
  solveDrag,
  translate,
  v2,
} from 'pocket-physics';
import { ViewportMan } from '../shared/viewport';
import { createGameLoop } from '../../loop';
import { listen, useRootElement } from '../../dom';
import { DrawDebugCamera } from '../shared/DebugDrawCamera';
import {
  debugDrawIntegratable,
  debugDrawIntegratableRect,
} from '../../draw-utils';
import {
  ViewportUnitVector2,
  ViewportUnits,
  asViewportUnits,
  clearScreen,
  drawTextLinesInViewport,
  restoreNativeCanvasDrawing,
  toPixelUnits,
  toProjectedPixels,
  toViewportUnits,
  vv2,
} from '../../components/ViewportCmp';
import { range } from '../shared/range';
import { makeMovementCmp } from '../../components/MovementCmp';
import { makeIntegratable } from '../shared/make-integratable';
import { YellowRGBA } from '../../theme';
import { setVelocity } from '../../phys-utils';
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

function easeOutCirc(x: number): number {
  return Math.sqrt(1 - Math.pow(x - 1, 2));
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
      0.2 * easeOutCirc(this.age / this.initialAge),
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
    debugDrawIntegratable(
      vp.v,
      vp.v.dprCanvas.ctx,
      this.movement,
      interp,
      this.radius,
    );

    // draw a nub to represent the rotation direction of the ship

    const nubDist = asViewportUnits(2);
    const vd: VelocityDerivable = {
      cpos: vv2(0, nubDist),
      ppos: vv2(0, nubDist),
    };

    // rotate acel according to ship's rotation
    rotate2d(vd.cpos, vd.cpos, vv2(), this.rotation);
    rotate2d(vd.ppos, vd.ppos, vv2(), this.rotation);

    // translate to ship's position
    add(vd.cpos, vd.cpos, this.movement.cpos);
    add(vd.ppos, vd.ppos, this.movement.ppos);

    debugDrawIntegratable(
      vp.v,
      vp.v.dprCanvas.ctx,
      vd,
      interp,
      asViewportUnits(0.5),
    );
  }

  translate(dir: 'forward' | 'back' | 'left' | 'right') {
    const power = 0.5;
    let acel;
    if (dir === 'forward') acel = vv2(0, power);
    else if (dir === 'back') acel = vv2(0, -power);
    else if (dir === 'left') acel = vv2(-power, 0);
    else if (dir === 'right') acel = vv2(power, 0);
    else return;

    // rotate acel according to ship's rotation
    const rotatedAcel = rotate2d(vv2(), acel, vv2(), this.rotation);
    add(this.movement.acel, this.movement.acel, rotatedAcel);
  }

  rotate(dir: 'left' | 'right') {
    const power = 0.1;
    let rot;
    if (dir === 'left') rot = power;
    else if (dir === 'right') rot = -power;
    else return;
    this.rotation += rot;
  }
}

function easeInExpo(x: number): number {
  return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
}

class Sig<T> {
  private owners = new Map<unknown, (it: T) => void>();
  on(owner: unknown, cb: (it: T) => void) {
    this.owners.set(owner, cb);
  }

  off(owner: unknown) {
    this.owners.delete(owner);
  }

  fire(it: T) {
    for (const [owner, cb] of this.owners) cb(it);
  }
}

class Vector2Tween extends Entity {
  elapsed = 0;
  current = v2();
  state: 'not-started' | 'running' | 'finished' = 'not-started';
  started = new Sig<void>();
  ended = new Sig<void>();

  constructor(
    eman: EntityMan,
    public durationMs: number,
    public startValue = v2(),
    public endValue = v2(),
    public ease = easeInExpo,
  ) {
    super(eman);

    copy(this.current, this.startValue);
  }

  start() {
    this.state = 'running';
    this.started.fire();
  }

  update(dt: number) {
    if (this.state !== 'running') return;
    this.elapsed += dt;
    if (this.elapsed < this.durationMs) {
      const t = this.ease(this.elapsed / this.durationMs);
      this.current.x = asViewportUnits(
        this.startValue.x + (this.endValue.x - this.startValue.x) * t,
      );
      this.current.y = asViewportUnits(
        this.startValue.y + (this.endValue.y - this.startValue.y) * t,
      );
    } else {
      copy(this.current, this.endValue);
      this.state = 'finished';
      this.ended.fire();
    }
  }

  destroy() {
    this.started.off(this);
    this.ended.off(this);
  }
}

class SceneTransition extends Entity {
  private tween0: Vector2Tween;
  private tween1: Vector2Tween;

  movement = makeIntegratable();
  wh = vv2(100, 100);

  constructor(
    eman: EntityMan,
    private vp: ViewportMan,
    private onComplete: () => void,
  ) {
    super(eman);
    this.tween0 = new Vector2Tween(
      eman,
      1000,
      add(vv2(), this.vp.v.camera.target, vv2(-100, 0)),
      copy(vv2(), this.vp.v.camera.target),
      easeInExpo,
    );
    // timing only
    this.tween1 = new Vector2Tween(eman, 1000);

    this.tween0.start();
    this.tween0.ended.on(this, () => this.tween1.start());
  }

  update(dt: number) {
    // each tick set tween target to camera position, just in case camera moves
    copy(this.tween0.endValue, this.vp.v.camera.target);

    // update output
    copy(this.movement.cpos, this.tween0.current);
    copy(this.movement.ppos, this.tween0.current);

    if (this.tween1.state === 'finished') {
      this.destroy();
      this.onComplete();
    }
  }

  draw(interp: number, vp: ViewportMan) {
    debugDrawIntegratableRect(
      vp.v,
      vp.v.dprCanvas.ctx,
      this.movement,
      interp,
      this.wh,
    );
  }

  destroy(): void {
    super.destroy();
    this.tween0.destroy();
    this.tween1.destroy();
  }
}

class LevelMan {
  level: Entity | null = null;

  setLevel(level: Entity) {
    this.level?.destroy();
    this.level = level;
  }
}

class Level0 extends Entity {
  constructor(
    eman: EntityMan,
    private vp: ViewportMan,
    levelMan: LevelMan,
  ) {
    super(eman);

    vp.v.dprCanvas.cvs.addEventListener(
      'click',
      () => {
        new SceneTransition(eman, this.vp, () => {
          levelMan.setLevel(new Level1(eman));
        });
      },
      { once: true },
    );
  }
}

class Level1 extends Entity {
  ship;

  constructor(eman: EntityMan) {
    super(eman);
    const c1 = new Circle(eman);
    const t1 = new TextEntity(eman);
    t1.setText('Hello', vv2(50, 0), 30);
    t1.movement.acel.y = asViewportUnits(-1);

    this.ship = new Ship(eman);
  }

  update(dt: number) {
    // keyboard controls
    isKeyDown('KeyW') && this.ship.translate('forward');
    isKeyDown('KeyS') && this.ship.translate('back');
    isKeyDown('KeyA') && this.ship.translate('left');
    isKeyDown('KeyD') && this.ship.translate('right');
    isKeyDown('KeyQ') && this.ship.rotate('left');
    isKeyDown('KeyE') && this.ship.rotate('right');
  }
}

class App implements Destroyable {
  eman = new EntityMan();
  vp = new ViewportMan(useRootElement);
  shaker = new ScreenShake(this.eman);
  levelMan = new LevelMan();

  stop = () => {};
  eventsOff = new AbortController();

  async boot() {
    const vp = this.vp;

    this.levelMan.setLevel(new Level0(this.eman, vp, this.levelMan));

    const { stop } = createGameLoop({
      drawTime: 1000 / 60,
      updateTime: 1000 / 60,
      update: (dt) => {
        this.eman.update(dt);
      },
      draw: (interp) => {
        clearScreen(vp.v);
        this.shaker.specialDraw(interp, vp, 'before');
        this.eman.draw(interp, vp);
        DrawDebugCamera()(vp);
        this.shaker.specialDraw(interp, vp, 'after');
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

    // TODO: move to an entity? how to get access to vp and shaker?

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
        this.shaker.shake(d, 200, 0);

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
