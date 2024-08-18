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
import { DrawDebugCamera } from '../shared/DrawDebugCamera';
import { range } from '../shared/range';
import { isKeyDown } from '../../keys';

import { zzfx } from 'zzfx';
import {
  asPixels,
  asWorldUnits,
  Camera2D,
  drawWorldText2,
  WorldUnits,
  WorldUnitVector2,
  wv2,
} from '../shared/Camera2d';

const SFX = {
  // prettier-ignore
  hit: () => zzfx(...[2.2,,322,.02,.1,,,3,7,-18,,,.06,1.8,34,.4,.14,.88,.01,.06]), // Hit 13
};

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

export function makeIntegratable(initial = wv2()) {
  return {
    cpos: copy(wv2(), initial),
    ppos: copy(wv2(), initial),
    acel: wv2(),
  };
}

class Circle extends Entity {
  movement: Integratable = makeIntegratable();
  radius = asWorldUnits(10);

  update(dt: number) {
    accelerate(this.movement, dt);
    inertia(this.movement);
  }

  draw(interp: number, vp: ViewportMan) {
    debugDrawIntegratable(vp.canvas.ctx, this.movement, interp, this.radius);
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
      vp.canvas.ctx.translate(this.offset.x, this.offset.y);
      vp.canvas.ctx.rotate(this.rotation);
    } else {
      vp.canvas.ctx.rotate(-this.rotation);
      vp.canvas.ctx.translate(-this.offset.x, -this.offset.y);
    }
  }
}

class TextEntity extends Entity {
  text = '';
  sizeInViewportLines = 30;

  movement = makeIntegratable();

  setText(text: string, pos: WorldUnitVector2, sizeInViewportLines: number) {
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
    // drawWorldText(
    //   vp.canvas.ctx,
    //   vp.camera.getRotation(),
    //   this.text,
    //   this.movement.cpos.x,
    //   this.movement.cpos.y,
    //   20,
    //   'center',
    // );
    drawWorldText2(
      vp.canvas.ctx,
      vp.camera,
      asPixels(vp.canvas.height),
      this.text,
      this.movement.cpos.x,
      this.movement.cpos.y,
      this.sizeInViewportLines,
      (ctx, fontSizePx) => {
        ctx.fillStyle = 'black';
        ctx.font = `${fontSizePx}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
      },
    );
  }
}

function easeOutCirc(x: number): number {
  return Math.sqrt(1 - Math.pow(x - 1, 2));
}

function easeInOutSine(x: number): number {
  return -(Math.cos(Math.PI * x) - 1) / 2;
}

class ParticleEntity extends Entity {
  movement = makeIntegratable();
  radius = asWorldUnits(1);
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
      vp.canvas.ctx,
      this.movement,
      interp,
      this.radius,
      0.2 * easeOutCirc(this.age / this.initialAge),
    );
  }
}

class ParticleBurst extends Entity {
  constructor(eman: EntityMan, pos: WorldUnitVector2, count: number) {
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
  radius = asWorldUnits(2);
  rotation = 0;

  constructor(
    eman: EntityMan,
    private camera: Camera2D,
  ) {
    super(eman);
    translate(wv2(0, 0), this.movement.cpos, this.movement.ppos);
  }

  update(dt: number) {
    accelerate(this.movement, dt);
    inertia(this.movement);
    solveDrag(this.movement, 0.9);

    this.camera.setPosition(this.movement.ppos);
  }

  draw(interp: number, vp: ViewportMan) {
    debugDrawIntegratable(vp.canvas.ctx, this.movement, interp, this.radius);

    // draw a nub to represent the rotation direction of the ship

    const nubDist = asWorldUnits(-2);
    const vd: VelocityDerivable = {
      cpos: wv2(0, nubDist),
      ppos: wv2(0, nubDist),
    };

    // rotate acel according to ship's rotation
    rotate2d(vd.cpos, vd.cpos, wv2(), this.rotation);
    rotate2d(vd.ppos, vd.ppos, wv2(), this.rotation);

    // translate to ship's position
    add(vd.cpos, vd.cpos, this.movement.cpos);
    add(vd.ppos, vd.ppos, this.movement.ppos);

    debugDrawIntegratable(vp.canvas.ctx, vd, interp, asWorldUnits(0.5));
  }

  translate(dir: 'forward' | 'back' | 'left' | 'right') {
    const power = 0.5;
    let acel;
    if (dir === 'forward') acel = wv2(0, -power);
    else if (dir === 'back') acel = wv2(0, power);
    else if (dir === 'left') acel = wv2(-power, 0);
    else if (dir === 'right') acel = wv2(power, 0);
    else return;

    // rotate acel according to ship's rotation
    const rotatedAcel = rotate2d(wv2(), acel, wv2(), this.rotation);
    add(this.movement.acel, this.movement.acel, rotatedAcel);
  }

  rotate(dir: 'left' | 'right') {
    const power = 0.1;
    let rot;
    if (dir === 'left') rot = -power;
    else if (dir === 'right') rot = power;
    else return;
    this.rotation += rot;
    this.camera.rotate(asWorldUnits(rot));
  }
}

class HoveringCircle extends Entity {
  private movement = makeIntegratable();
  private radius = asWorldUnits(4);

  private accumulator = 0;
  private tween;

  mode: 'acel' | 'tween' = 'acel';

  constructor(eman: EntityMan, initial = wv2(5, -10)) {
    super(eman);
    this.tween = new BoomerangVector2Tween(
      eman,
      2000,
      copy(wv2(), initial),
      wv2(initial.x, initial.y + 2),
      easeInOutSine,
    );
    this.tween.start();
    copy(this.movement.cpos, initial);
    copy(this.movement.ppos, initial);
  }

  update(dt: number) {
    if (this.mode === 'acel') {
      this.accumulator += dt;
      const hover = 0.01;
      const acel = wv2(0, hover * Math.sin(this.accumulator / 1000));
      add(this.movement.acel, this.movement.acel, acel);

      accelerate(this.movement, dt);
      inertia(this.movement);
      solveDrag(this.movement, 0.9);
    } else {
      this.tween.update(dt);
      copy(this.movement.cpos, this.tween.current);
      copy(this.movement.ppos, this.tween.current);
    }
  }

  draw(interp: number, vp: ViewportMan) {
    debugDrawIntegratable(vp.canvas.ctx, this.movement, interp, this.radius);
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
      this.current.x = asWorldUnits(
        this.startValue.x + (this.endValue.x - this.startValue.x) * t,
      );
      this.current.y = asWorldUnits(
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

class BoomerangVector2Tween extends Vector2Tween {
  update(dt: number) {
    super.update(dt);

    if (this.state === 'finished') {
      // swap start and end
      const temp = this.startValue;
      this.startValue = this.endValue;
      this.endValue = temp;

      // reset elapsed time
      this.elapsed = 0;

      // start again
      this.start();
    }
  }
}

class SceneTransition extends Entity {
  private tween0: Vector2Tween;
  private tween1: Vector2Tween;
  private tween2: Vector2Tween;

  movement = makeIntegratable();
  wh = wv2(100, 100);

  constructor(
    eman: EntityMan,
    private vp: ViewportMan,
    private onComplete: () => void,
  ) {
    super(eman);
    this.tween0 = new Vector2Tween(
      eman,
      1000,
      add(wv2(), this.vp.camera.getPosition(), wv2(-100, 0)),
      copy(wv2(), this.vp.camera.getPosition()),
      easeInExpo,
    );
    // timing only
    this.tween1 = new Vector2Tween(eman, 1000);
    // will be used for opacity
    this.tween2 = new Vector2Tween(eman, 1000, v2(1, 1), v2(0, 0));

    this.tween0.start();
    this.tween0.ended.on(this, () => {
      this.tween1.start();
      this.onComplete();
    });
    this.tween1.ended.on(this, () => this.tween2.start());
    this.tween2.ended.on(this, () => this.destroy());
  }

  update(dt: number) {
    // each tick set tween target to camera position, just in case camera moves
    copy(this.tween0.endValue, this.vp.camera.getPosition());

    // update output
    copy(this.movement.cpos, this.tween0.current);
    copy(this.movement.ppos, this.tween0.current);
  }

  draw(interp: number, vp: ViewportMan) {
    debugDrawIntegratableRect(
      vp.canvas.ctx,
      this.movement,
      interp,
      this.wh,
      this.tween2.current.x,
    );
  }

  destroy(): void {
    super.destroy();
    this.tween0.destroy();
    this.tween1.destroy();
  }
}

export function debugDrawIntegratableRect(
  ctx: CanvasRenderingContext2D,
  cmp: VelocityDerivable,
  interp: number,
  wh: WorldUnitVector2,
  opacity = 0.2,
) {
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = `rgba(0,0,255,${opacity})`;

  const vpX = cmp.ppos.x + (cmp.cpos.x - cmp.ppos.x) * interp;
  const vpY = cmp.ppos.y + (cmp.cpos.y - cmp.ppos.y) * interp;
  const halfW = wh.x / 2;
  const halfH = wh.y / 2;

  const x = vpX - halfW;
  const y = vpY - halfH;
  const w = wh.x;
  const h = wh.y;

  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

class LevelMan {
  level: Entity | null = null;

  setLevel(level: Entity) {
    this.level?.destroy();
    this.level = level;
  }
}

class Level0 extends Entity {
  constructor(eman: EntityMan, context: GameContext) {
    super(eman);

    const t1 = new TextEntity(eman);
    t1.setText('Click to Start!', wv2(0, 0), 30);

    const { vp, levelMan } = context;

    vp.canvas.cvs.addEventListener(
      'click',
      () => {
        new SceneTransition(eman, vp, () => {
          levelMan.setLevel(new Level1(eman, context));
        });

        t1.destroy();
      },
      { once: true },
    );
  }
}

class Level1 extends Entity {
  eventsOff = new AbortController();
  ship;

  constructor(eman: EntityMan, context: GameContext) {
    super(eman);
    const c1 = new Circle(eman);
    const t1 = new TextEntity(eman);
    t1.setText('Hello', wv2(0, 0), 30);
    t1.movement.acel.y = asWorldUnits(1);

    this.ship = new Ship(eman, context.vp.camera);

    const h0 = new HoveringCircle(eman);
    const h1 = new HoveringCircle(eman, wv2(9, 0));
    h1.mode = 'tween';

    addEventListener(
      'click',
      (ev) => {
        const { vp, shaker } = context;

        // How to pick from screen space to world:

        // canvas/element space
        const rect = vp.canvas.cvs.getBoundingClientRect();
        const cvsLocalX = ev.clientX - rect.left;
        const cvsLocalY = ev.clientY - rect.top;

        const worldSpace = vp.camera.screenToWorld(
          asPixels(cvsLocalX),
          asPixels(cvsLocalY),
          asPixels(vp.canvas.width),
          asPixels(vp.canvas.height),
        );

        // distance from center of screen (aka camera) to picked point
        const d = distance(worldSpace, vp.camera.getPosition());

        // shake according to distance
        shaker.shake(d, 200, 0);

        // burst at mouse position in world
        const p0 = new ParticleBurst(eman, worldSpace, 10);
        SFX.hit();
      },
      { signal: this.eventsOff.signal },
    );
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

interface GameContext {
  eman: EntityMan;
  vp: ViewportMan;
  shaker: ScreenShake;
  levelMan: LevelMan;
}

class App implements Destroyable {
  context: GameContext;
  stop = () => {};
  eventsOff = new AbortController();

  constructor() {
    const eman = new EntityMan();
    this.context = {
      eman,
      vp: new ViewportMan(useRootElement),
      shaker: new ScreenShake(eman),
      levelMan: new LevelMan(),
    };
  }

  async boot() {
    const { eman, vp, shaker, levelMan } = this.context;
    levelMan.setLevel(new Level0(eman, this.context));

    const { stop } = createGameLoop({
      drawTime: 1000 / 60,
      updateTime: 1000 / 60,
      update: (dt) => {
        eman.update(dt);
      },
      draw: (interp) => {
        const ctx = vp.canvas.ctx;
        ctx.clearRect(0, 0, vp.canvas.width, vp.canvas.height);

        ctx.save();
        vp.camera.applyToContext(
          ctx,
          asPixels(vp.canvas.width),
          asPixels(vp.canvas.height),
        );

        shaker.specialDraw(interp, vp, 'before');
        eman.draw(interp, vp);
        DrawDebugCamera()(vp);
        shaker.specialDraw(interp, vp, 'after');
        ctx.restore();
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
          vp.camera.move(asWorldUnits(1), asWorldUnits(0));
        } else if (ev.key === 'ArrowLeft') {
          vp.camera.move(asWorldUnits(-1), asWorldUnits(0));
        } else if (ev.key === 'ArrowUp') {
          vp.camera.rotate(asWorldUnits(0.01));
        } else if (ev.key === 'ArrowDown') {
          vp.camera.rotate(asWorldUnits(-0.01));
        }
      },
      { signal: this.eventsOff.signal },
    );
  }

  async destroy() {
    this.stop();
  }
}
