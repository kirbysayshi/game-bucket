(function () {
    'use strict';

    function v2(x, y) {
        return { x: x || 0, y: y || 0 };
    }
    let copy = (out, a) => {
        out.x = a.x;
        out.y = a.y;
        return out;
    };
    let set = (out, x, y) => {
        out.x = x;
        out.y = y;
        return out;
    };

    let accelerate = (cmp, dt) => {
        // apply acceleration to current position, convert dt to seconds
        cmp.cpos.x += cmp.acel.x * dt * dt * 0.001;
        cmp.cpos.y += cmp.acel.y * dt * dt * 0.001;
        // reset acceleration
        set(cmp.acel, 0, 0);
    };

    let inertia = (cmp) => {
        let x = cmp.cpos.x * 2 - cmp.ppos.x;
        let y = cmp.cpos.y * 2 - cmp.ppos.y;
        set(cmp.ppos, cmp.cpos.x, cmp.cpos.y);
        set(cmp.cpos, x, y);
    };

    var TestPng = "214fcfc8c74f8dee.png";

    function loadImage(path) {
      return new Promise((resolve, reject) => {
        let i = new Image();

        i.onload = () => resolve(i);

        i.onerror = reject;
        i.src = path;
      });
    }

    //   path: string;
    //   name: string;
    // }

    let AssetRegistry = [{
      path: TestPng,
      name: 'test'
    }];
    // type LoadedAssetMap = { [key in AssetNames]: LoadedAsset };
    // let loadedAssets: { [key: string]: LoadedAsset } = {};
    // let loaded = false;
    // export async function loadAssets() {
    //   await Promise.all(
    //     unloaded.map(async u => {
    //       let img = await loadImage(u.path);
    //       loadedAssets[u.name] = { path: u.path, name: u.name, img };
    //     })
    //   );
    //   loaded = true;
    // }
    class AssetMap {
      loadedAssets = {};

      async preload(opt_onlyLoad) {
        if (opt_onlyLoad === void 0) {
          opt_onlyLoad = new Set();
        }

        await Promise.all(AssetRegistry.map(async u => {
          if (this.loadedAssets[u.name] || opt_onlyLoad.size > 0 && !opt_onlyLoad.has(u.name)) return;
          let img = await loadImage(u.path);
          this.loadedAssets[u.name] = {
            path: u.path,
            name: u.name,
            img
          };
        }));
      }

      getImage(name) {
        let asset = this.loadedAssets[name];
        if (!asset) throw new Error(`Asset ${name} not loaded!`);
        return asset.img;
      }

    } // export function useAsset(name: AssetNames) {
    //   if ("production" !== "production") {
    //     if (!loaded) throw new Error("Assets were accessed but not loaded!");
    //   }
    //   return loadedAssets[name].img;
    // }

    /* eslint-disable @typescript-eslint/explicit-module-boundary-types */
    // The primary key into the component data. If `destroyed`, then this key is
    // considered dead and components cannot be added or removed.
    // An "Owned" or "Borrowed" EntityId is generally used when destroying an
    // EntityId that has a component that references another EntityId. If the ID is
    // owned by the component data, that ID will also be destroyed. If the ID is
    // merely borrowed, it will not be destroyed.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function isEntityId(obj) {
      return obj && typeof obj === 'object' && typeof obj.id === 'number';
    } // eslint-disable-next-line @typescript-eslint/no-explicit-any


    function isOwnedEntityId(obj) {
      let id = isEntityId(obj);
      return id && obj.owned === true;
    } // eslint-disable-next-line @typescript-eslint/no-explicit-any


    function isBorrowedEntityId(obj) {
      let id = isEntityId(obj);
      return id && obj.owned === false;
    }

    /**
     * This class follows the Entity Component System Pattern often found in game
     * development. It is a data-oriented pattern that allows Entities (an id) to be
     * the primary lookup key for Components (the actual data instance).
     */
    class CES3 {
      lastId = -1;
      destroyed = new Set(); // the index of each array is the entity id

      cmpToIdArr = new Map();

      constructor(initialMaxDataCount) {
        if (initialMaxDataCount === void 0) {
          initialMaxDataCount = 100;
        }

        this.initialMaxDataCount = initialMaxDataCount;
        this.ids = new Array(initialMaxDataCount);
      }

      nextId() {
        while (true) {
          let test = ++this.lastId;

          if (test < this.initialMaxDataCount) {
            if (this.ids[test]) continue;else {
              return this.ids[test] = {
                id: test,
                owned: true,
                destroyed: false
              };
            }
          } else {
            // expand and reset
            this.lastId = -1;
            let max = this.initialMaxDataCount = this.initialMaxDataCount * 10;


            let nextIds = new Array(max);

            for (let i = 0; i < this.ids.length; i++) {
              nextIds[i] = this.ids[i];
            }

            this.ids = nextIds; // Expand each data array

            for (let [kind, datas] of this.cmpToIdArr) {
              let next = new Array(max);

              for (let i = 0; i < datas.length; i++) {
                next[i] = datas[i];
              }

              this.cmpToIdArr.set(kind, next);
            }
          }
        }
      }

      allEntities() {
        return this.ids;
      }

      destroy(eid) {
        if (eid === undefined) return;
        eid.destroyed = true;
        this.destroyed.add(eid.id);
      }

      isDestroyed(eid) {
        return eid.destroyed || this.destroyed.has(eid.id) || !this.ids[eid.id];
      }

      flushDestruction() {
        if (this.destroyed.size === 0) return;
        let reflush = false;

        let recurse = obj => {
          if (obj && typeof obj === 'object' && !isEntityId(obj)) {
            Object.values(obj).forEach(value => {
              if (isOwnedEntityId(value) && !isBorrowedEntityId(value)) {
                this.destroy(value);
                reflush = true;
              } else {
                recurse(value);
              }
            });
          }
        };

        this.destroyed.forEach(id => {
          this.destroyed.delete(id);
          this.ids[id] = undefined;

          for (let [, datas] of this.cmpToIdArr) {
            let data = datas[id];
            if (!data) continue;
            recurse(data);
            datas[id] = undefined;
          }
        }); // We have found more entities to delete. Flush again!

        if (reflush) this.flushDestruction();
      }

      entity(initData) {
        let eid = this.nextId();

        for (let i = 0; i < initData.length; i++) {
          let data = initData[i];
          this.add(eid, data);
        }

        return eid;
      }
      /**
       * Even with an AssuredEntityId, there is actually no guarantee the id is
       * still valid, so this returns optional undefined. A `select` could have
       * occurred in a previous frame, or it could be an ID stashed on another
       * entity.
       */


      data(eid, kind) {
        if (!eid || eid.destroyed) return;
        let datas = this.cmpToIdArr.get(kind);

        return datas?.[eid.id];
      }

      add(eid, initData) {
        if (eid.destroyed) return;
        let datas = this.cmpToIdArr.get(initData.k) ?? Array(this.initialMaxDataCount); // TODO: what if data already exists? Destroy?

        datas[eid.id] = initData;
        this.cmpToIdArr.set(initData.k, datas); // the id is now UPGRADED
        // return eid as AssuredEntityId<T>;

        return eid;
      }

      remove(eid, kind) {
        if (eid.destroyed) return;
        let datas = this.cmpToIdArr.get(kind);
        if (!datas) return eid;
        datas[eid.id] = undefined;
        return eid;
      }

      has(eid, kind) {
        let datas = this.cmpToIdArr.get(kind);
        if (eid.destroyed || !datas || !datas[eid.id]) return false;
        return true;
      }

      select(kinds) {
        let matching = new Set();

        for (let i = 0; i < kinds.length; i++) {
          let kind = kinds[i];
          let datas = this.cmpToIdArr.get(kind);
          if (!datas) return [];

          if (matching.size === 0) {
            for (let k = 0; k < datas.length; k++) {
              let data = datas[k];
              if (data !== undefined) matching.add(this.ids[k]);
            }
          } else {
            for (let eid of matching.values()) {
              if (datas[eid.id] === undefined) matching.delete(eid);
            }
          }
        }

        return [...matching];
      }

      selectData(kind) {
        let datas = this.cmpToIdArr.get(kind);
        if (!datas) return [];
        return datas;
      }

      selectFirst(kinds) {
        let selection = this.select(kinds);
        if (selection.length === 0) return undefined;
        return selection[0];
      }

      selectFirstData(kind) {
        let datas = this.cmpToIdArr.get(kind);

        if (!datas) return;

        for (let i = 0; i < datas.length; i++) {
          let data = datas[i];
          if (data !== undefined) return data;
        }
      }

    }

    let DrawTimeHz = 60;
    let UpdateTimeHz = 30; // A system of an entity-component-system framework is simply a function that
    // is repeatedly called. We separate them into two types based on how often
    // they are invoked: every frame or once every update step (10fps by default).

    let ces = new CES3();
    function useCES() {
      return ces;
    }

    let qsel = document.querySelector.bind(document);
    let ROOT_EL = qsel("#r");
    let PRIMARY_CVS = qsel("#c");
    let UI_ROOT = qsel("#u");

    if (!ROOT_EL || !PRIMARY_CVS || !UI_ROOT) {
      throw new Error("Could not locate DOM!");
    }

    function usePrimaryCanvas() {
      return PRIMARY_CVS;
    }
    function useRootElement() {
      return ROOT_EL;
    }
    function listen(el, ev, handler) {
      el.addEventListener(ev, handler, false);
      return () => {
        el.removeEventListener(ev, handler, false);
      };
    }

    function assertDefinedFatal(value, context) {
      if (context === void 0) {
        context = '';
      }

      if (value == null || value === undefined) {
        throw new Error(`Fatal error: value ${value} ${context ? `(${context})` : ''} must not be null/undefined.`);
      }
    }

    function makeDPRCanvas(width, height, cvs) {
      let ctx = cvs.getContext('2d');
      if (!ctx) throw new Error('Could not create Context2d!'); // https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio

      let dpr = window.devicePixelRatio || 1;
      cvs.style.width = width + 'px';
      cvs.style.height = height + 'px';
      cvs.width = Math.floor(width * dpr);
      cvs.height = Math.floor(height * dpr);
      ctx.scale(dpr, dpr); // These need to be set each time the canvas resizes to ensure the backing
      // store retains crisp pixels.
      // TODO: is this necessary if the props are set in CSS?

      ctx.webkitImageSmoothingEnabled = false;
      ctx.msImageSmoothingEnabled = false;
      ctx.mozImageSmoothingEnabled = false;
      ctx.imageSmoothingEnabled = false;
      return {
        width,
        height,
        cvs,
        ctx,
        dpr
      };
    } // function fillStyle(dpr: DPRCanvas, style: CanvasRenderingContext2D['fillStyle']) {
    //   dpr.ctx.fillStyle = style;
    // }

    let viewportSelector = ['viewport', 'spring-constraint']; // TODO: this should probably be a "camera"
    // TODO: probably want a "do not shake" property. UI Shaking might be weird.

    let toPixelUnits = function (n, axis) {
      if (axis === void 0) {
        axis = 'x';
      }

      let ces = useCES();
      let id = ces.selectFirst(viewportSelector);
      let vp = ces.data(id, 'viewport');
      assertDefinedFatal(vp, 'no viewport'); // Super hack! Assume constraint.v1 is the un-anchored point

      let shakeConstraint = ces.data(id, 'spring-constraint');
      let shake = ces.data(shakeConstraint?.v1, 'v-movement');
      assertDefinedFatal(shake, 'no shake');
      let x = shake.cpos.x;
      let y = shake.cpos.y;
      let withShakeX = (n + x) / vp.vpWidth;
      let withShakeY = (n + y) / vp.vpHeight;
      let cvs = vp.dprCanvas;
      let pixels = axis === 'x' ? cvs.width * withShakeX : cvs.height * withShakeY;
      return Math.floor(pixels);
    };
    let toViewportUnits = n => {
      let ces = useCES();
      let vp = ces.selectFirstData('viewport');

      let units = n / vp.dprCanvas.width * 100;
      return units;
    };
    function drawAsset(asset, interp, cpos, ppos, width, height, center) {
      if (height === void 0) {
        height = width;
      }

      if (center === void 0) {
        center = false;
      }

      let ces = useCES();
      let vp = ces.selectFirstData('viewport');
      let x = toPixelUnits(ppos.x + interp * (cpos.x - ppos.x));
      let y = toPixelUnits(ppos.y + interp * (cpos.y - ppos.y));
      let pxWidth = toPixelUnits(width);
      let pxHeight = toPixelUnits(height);
      vp.dprCanvas.ctx.drawImage(asset, 0, 0, asset.width, asset.height, center ? x - pxWidth / 2 : x, center ? y - pxHeight / 2 : y, pxWidth, pxHeight);
    }
    function deriveViewportCmp() {
      let ratio = 0.6; // if the window is taller than wide, use the window width for the width.
      // Otherwise, use the ratio to derive the width from the window height

      let width = window.innerWidth < window.innerHeight ? window.innerWidth : window.innerHeight * ratio; // if the window is taller than wide, use the window width to derive the height.
      // Otherwise, use the window height as the height.

      let height = window.innerWidth < window.innerHeight ? window.innerWidth / ratio : window.innerHeight;
      return {
        k: 'viewport',
        ratio,
        width: width,
        height: height,
        vpWidth: 100,
        vpHeight: 100 / 0.6,
        dprCanvas: makeDPRCanvas(width, height, usePrimaryCanvas())
      };
    }
    function computeWindowResize() {
      let cmp = deriveViewportCmp();
      let ces = useCES();
      {
        // On resize, destroy existing component and depdendent components.
        let existingId = ces.selectFirst(viewportSelector);
        let constraint = ces.data(existingId, 'spring-constraint');
        ces.destroy(constraint?.v1);
        ces.destroy(constraint?.v2);
        ces.destroy(existingId);
      }
      let anchor = {
        k: 'v-movement',
        cpos: v2(),
        ppos: v2(),
        acel: v2()
      };
      let shake = {
        k: 'v-movement',
        cpos: v2(),
        ppos: v2(),
        acel: v2()
      };
      let anchorId = ces.entity([anchor]);
      let shakeId = ces.entity([shake]);
      let constraint = {
        k: 'spring-constraint',
        v1: shakeId,
        v1Mass: 10,
        v2: anchorId,
        v2Mass: 0,
        goal: 0.1,
        stiffness: 0.2
      };
      let root = useRootElement();
      root.style.width = cmp.width + 'px';
      let def = [cmp, constraint];
      ces.entity(def);
    }
    window.addEventListener('resize', computeWindowResize);

    // https://developers.google.com/web/fundamentals/design-and-ux/input/touch/#implement-custom-gestures
    // https://github.com/RByers/rbyers.github.io/blob/master/paint.js

    function pointInBox(point, box) {
      return point.x > box.center.x - box.half.x && point.x < box.center.x + box.half.x && point.y > box.center.y - box.half.y && point.y < box.center.y + box.half.y;
    }
    let dragStateSelector = ['drag-state', 'v-movement'];

    let pointFromEvent = ev => {
      let asTouch = ev;
      let asMouse = ev;

      if (asTouch.targetTouches) {
        return v2(toViewportUnits(asTouch.targetTouches[0].clientX), toViewportUnits(asTouch.targetTouches[0].clientY));
      } else {
        return v2(toViewportUnits(asMouse.clientX), toViewportUnits(asMouse.clientY));
      }
    }; // TODO: enable plain mouse events too! Remember that mousemove events only
    // fire if the mouse is still over the element.


    function excludeDestroyed(ids) {
      let ces = useCES();
      return ids.filter(id => !ces.isDestroyed(id));
    } // Without exporting and calling, Rollup was excluding these listeners!
    // Proably a better pattern to enclose side-effects into an init function
    // anyway but very unintuitive.


    function initDragListeners() {
      let root = useRootElement();
      listen(root, 'touchstart', ev => {
        let point = pointFromEvent(ev);
        let ces = useCES(); // search: did we hit something touchable?

        let targets = ces.select(['pointer-target']);
        let found = null;
        let foundCenter = null;
        targets.forEach(id => {
          if (found) return;
          let data = ces.data(id, 'pointer-target');

          if (data && pointInBox(point, data.box)) {
            found = id;
            foundCenter = data.box.center;
          }
        });
        if (!found || !foundCenter) return;
        ev.preventDefault(); // found a target, create a drag state for it!

        let e = [{
          k: 'drag-state',
          target: found
        }, {
          k: 'v-movement',
          // Use the found center so the drag target "snaps" to the touch position
          cpos: copy(v2(), foundCenter),
          ppos: copy(v2(), foundCenter),
          // cpos: copy(v2(), point) as ViewportUnitVector2,
          // ppos: copy(v2(), point) as ViewportUnitVector2,
          acel: v2()
        }];
        ces.entity(e);
      });
      listen(root, 'touchmove', ev => {
        let ces = useCES();
        let ids = excludeDestroyed(ces.select(dragStateSelector));
        if (ids.length === 0) return;
        ev.preventDefault(); // update the drag state with the event position

        let point = pointFromEvent(ev);
        let pos = ces.data(ids[0], 'v-movement');
        assertDefinedFatal(pos); // copying the current position to previous will create velocity!
        // we don't want that, since this is now a tracked physics object.
        // copy(pos.ppos, pos.cpos);
        // copy(pos.cpos, point);

        copy(pos.cpos, point);
        copy(pos.ppos, point);
      });
      listen(root, 'touchend', ev => {
        let ces = useCES();
        let ids = excludeDestroyed(ces.select(dragStateSelector));
        if (ids.length === 0) return;
        ev.preventDefault();
        let data = ces.data(ids[0], 'drag-state');
        assertDefinedFatal(data);
        data.target = null;
        ces.destroy(ids[0]);
      });
    }

    // This is basically an adaptation of
    // https://github.com/IceCreamYou/MainLoop.js/blob/gh-pages/src/mainloop.js,
    // with some removals / shrinking.
    // Without a stable game loop, the game will run quite differently on older
    // computers or browsers. In one it might be way easier, since it could run
    // much slower! This helps to prevent that.
    let noop = () => {
      return void 0;
    };

    let createGameLoop = _ref => {
      let {
        drawTime,
        updateTime,
        draw,
        update,
        panicAt = 10,
        onPanic = noop,
        onFPS = noop,
        accumulatorTick = window.requestAnimationFrame.bind(window),
        cancelAccumulatorTick = window.cancelAnimationFrame
      } = _ref;
      let perf = performance;
      let drawMs = drawTime;
      let updateMs = updateTime;
      let pnow = perf.now.bind(perf);
      let rAF = accumulatorTick;
      let updateAccumulator = 0;
      let drawAccumulator = 0;
      let raf = null;
      let lastLoop = pnow();
      let lastFPS = pnow();
      let framesThisSecond = 0;
      let fps = 60;

      function accumulate() {
        let now = pnow();
        raf = rAF(accumulate);
        let dt = now - lastLoop;
        updateAccumulator += dt;
        drawAccumulator += dt;
        lastLoop = now;
        let shouldDraw = drawAccumulator - drawMs >= 0;
        let step = Math.floor(updateAccumulator / updateMs);

        if (step >= panicAt) {
          updateAccumulator = 0;
          lastLoop = pnow();
          onPanic();
          return;
        }

        while (step-- > 0) {
          updateAccumulator -= updateMs;
          update(updateMs);
        }

        if (shouldDraw) {
          drawAccumulator -= drawMs; // pass update-based interpolation factor for smooth animations

          draw(1 - (updateMs - updateAccumulator) / updateMs, drawMs);
          framesThisSecond += 1;
        }

        if (lastFPS + 1000 <= now) {
          fps = 0.25 * framesThisSecond + 0.75 * fps;
          framesThisSecond = 0;
          lastFPS = now;
          onFPS(fps);
        }
      }

      accumulate();

      let stop = () => {
        if (raf) cancelAccumulatorTick(raf);
      };

      return {
        stop
      };
    };

    let LAST_ID = 0;
    let tasks = [];
    let schedule = (action, delay) => {
      tasks.push({
        id: ++LAST_ID,
        action,
        delay,
        age: 0
      });
    };
    let tick = function (dt) {
      if (dt === void 0) {
        dt = 1;
      }

      // copy the array in case some tasks need to be expunged.
      tasks.slice().forEach((t, idx) => {
        t.age += dt;

        if (t.age >= t.delay) {
          tasks.splice(idx, 1);
          t.action(t.delay, t.age);
        }
      });
    };

    console.log(TestPng);

    async function boot() {
      let assets = new AssetMap();
      await assets.preload(); // A component=entity-system(s) is a pattern for managing the lifecycles and
      // structures of differently structured data. It can be thought of as a
      // document database. Each entity (document) has a numeric id. Specific
      // fields and combinations of fields across the entire Store can be queried
      // by `select`ing those fields, as seen below.

      let ces = useCES(); // create the initial viewport and sizing

      computeWindowResize(); // initialize touch: look at js13k-2019 for how to use (pointer-target, etc)

      initDragListeners(); // An entity is just a numeric ID with associated "tagged" data denoted by
      // property 'k'. The unique names give to 'k' allow us to lookup that data
      // and modify it.

      let e1 = ces.entity([{
        k: 'v-movement',
        cpos: {
          x: 0,
          y: 0
        },
        ppos: {
          x: 0,
          y: 0
        },
        acel: {
          x: 10,
          y: 0
        }
      }, {
        k: 'draw-console'
      }]); // A system of an entity-component-system framework is simply a function that
      // is repeatedly called. We separate them into two types based on how often
      // they are invoked: every frame or once every update step (10fps by default).

      let drawStepSystems = [];
      let updateStepSystems = []; // Physics "system", updated at 10fps

      updateStepSystems.push(function (ces, dt) {
        let entities = ces.select(['v-movement']);
        entities.forEach(e => {
          let cmp = ces.data(e, 'v-movement');
          if (!cmp) return;
          accelerate(cmp, dt);
          inertia(cmp);
        });
      }); // clear the screen at 60fps

      drawStepSystems.push(ces => {
        let screen = ces.selectFirstData('viewport');
        screen.dprCanvas.ctx.clearRect(0, 0, screen.dprCanvas.cvs.width, screen.dprCanvas.cvs.height);
      }); // Draw "system" updated at 60fps

      drawStepSystems.push(function (ces, interp) {
        let bg = assets.getImage('test');
        let screen = ces.selectFirstData('viewport');
        drawAsset(bg, interp, v2(0, 0), v2(0, 0), screen.vpWidth, screen.vpHeight);
      }); // "draw" the position of this object to the console at 60fps

      drawStepSystems.push(function (ces, interp) {
        let entities = ces.select(['v-movement', 'draw-console']);
        entities.forEach(e => {
          let cmp = ces.data(e, 'v-movement');
          if (!cmp) return;
          console.log('x', cmp.ppos.x + (cmp.cpos.x - cmp.ppos.x) * interp);
          console.log('y', cmp.ppos.y + (cmp.cpos.y - cmp.ppos.y) * interp);
        });
      }); // fps entity

      ces.entity([{
        k: 'fps',
        v: 60
      }]); // Draw the FPS as text on the canvas

      drawStepSystems.push(ces => {
        let screen = ces.selectFirstData('viewport');
        let fpsData = ces.selectFirstData('fps');
        let text = fpsData.v.toFixed(2); // How many lines of text do we want to be able to display on canvas?
        // Ok, use that as the font size. This assumes the canvas size _ratio_ is fixed but
        // the actual pixel dimensions are not.
        // TODO: The canvas size is currently a fixed ratio, but different physical sizes
        // depending on the screen in order to have crisp pixels regardless. This means all
        // layout must be relative units. This might be a huge problem / difficulty...

        let maxLinesPerCanvas = 44;
        let textSize = screen.height / maxLinesPerCanvas;
        let lineHeight = 1.5;
        screen.dprCanvas.ctx.font = `${textSize}/${lineHeight} monospace`;
        let measure = screen.dprCanvas.ctx.measureText(text);
        let width = measure.width + 1; // fillText uses textBaseline as coordinates. "alphabetic" textBaseline is default,
        // so we attempt to compensate by subtracting the text size.
        // For example, drawing "g" at 0,0 will result in only the decender showing on the
        // canvas! We could change the baseline, but then text blocks / paragraphs would be
        // hard to read.

        let height = textSize * lineHeight - textSize;
        screen.dprCanvas.ctx.fillStyle = 'rgba(255,255,0,1)';
        screen.dprCanvas.ctx.fillText(text, screen.width - width, screen.height - height);
      }); // schedule a callback for a specified "best effort" time in the future.

      schedule((scheduledDelay, actualDelay) => {
        // destroy the entity after 3500 ms
        ces.destroy(e1);
        console.log('marked entity for destruction', e1);
      }, 3500);
      createGameLoop({
        drawTime: 1000 / DrawTimeHz,
        updateTime: 1000 / UpdateTimeHz,
        update: dt => {
          // Increment scheduled actions.
          tick(dt); // Update all the "update" systems

          updateStepSystems.forEach(s => s(ces, dt)); // Actualy destroy any entities that were marked for destruction. We do
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
        onPanic,
        onFPS
      }); // Turn into dead-code during minification via NODE_ENV check.
    }

    function onPanic() {
    }

    function onFPS(fps) {
      let ces = useCES();
      let data = ces.selectFirstData('fps');
      data.v = fps;
    }

    boot();

})();
