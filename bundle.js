(function () {
	'use strict';

	var _extends = Object.assign || function (target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i];

	    for (var key in source) {
	      if (Object.prototype.hasOwnProperty.call(source, key)) {
	        target[key] = source[key];
	      }
	    }
	  }

	  return target;
	};

	var knownTags = {};
	var LAST_E_ID = 0;

	var Entity = function Entity(props) {
	  var e = _extends({
	    id: LAST_E_ID++
	  }, props);

	  props.tags && props.tags.forEach(function (p) {
	    knownTags[p] = knownTags[p] || [];
	    knownTags[p].push(e);
	  });

	  return e;
	};

	var System = function System(action) {
	  for (var _len = arguments.length, tags = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
	    tags[_key - 1] = arguments[_key];
	  }

	  return function () {
	    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	      args[_key2] = arguments[_key2];
	    }

	    var entities = tags.reduce(function (founds, t) {
	      var tagged = knownTags[t];
	      tagged.forEach(function (e) {
	        if (founds[e.id]) return;
	        // Only give the entity to this system if the entity has every tag the
	        // system requires.
	        if (tags.every(function (stag) {
	          return e.tags.indexOf(stag) > -1;
	        })) {
	          founds[e.id] = e;
	        }
	      });
	      return founds;
	    }, {});

	    // pass the ...args from the invocation of the system to the action.
	    action.apply(undefined, [Object.keys(entities).map(function (id) {
	      return entities[id];
	    })].concat(args));
	  };
	};

	var destroyEntity = function destroyEntity(e) {
	  // TODO: this may need to be a "scheduleDestroyEntity"
	  e.tags.forEach(function (t) {
	    var tagged = knownTags[t];
	    var idx = tagged.indexOf(e);
	    if (idx === -1) return;
	    tagged.splice(idx, 1);
	  });
	  e.tags.length = 0;
	  e.destroyed = true;
	};

	var LAST_ID = 0;
	var tasks = [];

	var schedule = function schedule(action, delay) {
	  tasks.push({
	    id: ++LAST_ID,
	    action: action,
	    delay: delay,
	    age: 0
	  });
	};

	var tick = function tick() {
	  var dt = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];

	  // copy the array in case some tasks need to be expunged.
	  tasks.slice().forEach(function (t, idx) {
	    t.age += dt;

	    if (t.age >= t.delay) {
	      tasks.splice(idx, 1);
	      t.action(t.delay, t.age);
	    }
	  });
	};

	// This is basically an adaptation of
	// https://github.com/IceCreamYou/MainLoop.js/blob/gh-pages/src/mainloop.js,
	// with some removals / shrinking.

	// Without a stable game loop, the game will run quite differently on older
	// computers or browsers. In one it might be way easier, since it could run
	// much slower! This helps to prevent that.

	var Loop = function Loop(_ref) {
	  var drawTime = _ref.drawTime;
	  var updateTime = _ref.updateTime;
	  var draw = _ref.draw;
	  var update = _ref.update;
	  var _ref$panicAt = _ref.panicAt;
	  var panicAt = _ref$panicAt === undefined ? 10 : _ref$panicAt;
	  var _ref$onPanic = _ref.onPanic;
	  var onPanic = _ref$onPanic === undefined ? function () {} : _ref$onPanic;
	  var _ref$onFPS = _ref.onFPS;
	  var onFPS = _ref$onFPS === undefined ? function () {} : _ref$onFPS;


	  var perf = window.performance;

	  var drawMs = drawTime;
	  var updateMs = updateTime;
	  var pnow = perf.now.bind(perf);
	  var rAF = window.requestAnimationFrame.bind(window);

	  var accumulator = 0;
	  var raf = null;
	  var lastLoop = pnow();
	  var lastFPS = pnow();
	  var framesThisSecond = 0;
	  var fps = 0;

	  (function accumulate(now) {
	    raf = rAF(accumulate);

	    var dt = now - lastLoop;
	    accumulator += dt;
	    lastLoop = now;

	    var shouldDraw = accumulator - drawMs >= 0;
	    var step = Math.floor(accumulator / updateMs);

	    if (step >= panicAt) {
	      accumulator = 0;
	      lastLoop = pnow();
	      onPanic();
	      return;
	    }

	    while (step-- > 0) {
	      accumulator -= updateMs;
	      update(updateMs);
	    }

	    if (shouldDraw) {
	      // pass interpolation factor for smooth animations
	      draw(accumulator / drawMs);
	    }

	    framesThisSecond += 1;

	    if (lastFPS + 1000 <= now) {
	      fps = 0.25 * framesThisSecond + 0.75 * fps;
	      framesThisSecond = 0;
	      lastFPS = now;
	      onFPS(fps);
	    }
	  })(pnow());

	  var stop = function stop() {
	    if (raf) cancelAnimationFrame(raf);
	  };

	  return {
	    stop: stop
	  };
	};

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var v2 = createCommonjsModule(function (module) {
	function v2(x, y) {
	  return { x: x || 0, y: y || 0 };
	}

	v2.copy = function (out, a) {
	  out.x = a.x;
	  out.y = a.y;
	  return out;
	};

	v2.set = function (out, x, y) {
	  out.x = x;
	  out.y = y;
	  return out;
	};

	v2.add = function (out, a, b) {
	  out.x = a.x + b.x;
	  out.y = a.y + b.y;
	  return out;
	};

	v2.sub = function (out, a, b) {
	  out.x = a.x - b.x;
	  out.y = a.y - b.y;
	  return out;
	};

	v2.scale = function (out, a, factor) {
	  out.x = a.x * factor;
	  out.y = a.y * factor;
	  return out;
	};

	v2.distance = function (v1, v2) {
	  var x = v1.x - v2.x;
	  var y = v1.y - v2.y;
	  return Math.sqrt(x * x + y * y);
	};

	v2.distance2 = function (v1, v2) {
	  var x = v1.x - v2.x;
	  var y = v1.y - v2.y;
	  return x * x + y * y;
	};

	v2.magnitude = function (v1) {
	  var x = v1.x;
	  var y = v1.y;
	  return Math.sqrt(x * x + y * y);
	};

	v2.normalize = function (out, a) {
	  var x = a.x;
	  var y = a.y;
	  var len = x * x + y * y;
	  if (len > 0) {
	    len = 1 / Math.sqrt(len);
	    out.x = a.x * len;
	    out.y = a.y * len;
	  }
	  return out;
	};

	module.exports = v2;
	});

	var require$$0 = (v2 && typeof v2 === 'object' && 'default' in v2 ? v2['default'] : v2);

	var accelerate2d = createCommonjsModule(function (module) {
	var v2 = require$$0;

	module.exports = function (cmp, dt) {
	  // apply acceleration to current position, convert dt to seconds
	  cmp.cpos.x += cmp.acel.x * dt * dt * 0.001;
	  cmp.cpos.y += cmp.acel.y * dt * dt * 0.001;

	  // reset acceleration
	  v2.set(cmp.acel, 0, 0);
	};
	});

	var accelerate = (accelerate2d && typeof accelerate2d === 'object' && 'default' in accelerate2d ? accelerate2d['default'] : accelerate2d);

	var inertia2d = createCommonjsModule(function (module) {
	var v2 = require$$0;

	module.exports = function (cmp) {
	  var x = cmp.cpos.x * 2 - cmp.ppos.x,
	      y = cmp.cpos.y * 2 - cmp.ppos.y;

	  v2.set(cmp.ppos, cmp.cpos.x, cmp.cpos.y);
	  v2.set(cmp.cpos, x, y);
	};
	});

	var inertia = (inertia2d && typeof inertia2d === 'object' && 'default' in inertia2d ? inertia2d['default'] : inertia2d);

	// This is an "entity", aka a bag of data, with a special array named `tags`.
	// These tags mark an entity as processable by a system that has matching tags.
	// The system will only invoke its routine if an entity or entities has every
	// tag the system requires.
	var e1 = Entity({
	  tags: ['phys-no-col', 'draw-console'],
	  cpos: { x: 0, y: 0 },
	  ppos: { x: 0, y: 0 },
	  acel: { x: 10, y: 0 }
	});

	var physicsSystem = System(function (entities, dt) {
	  // entities is passed in at call time from within.
	  // dt comes from calling the system manually below.
	  entities.forEach(function (e) {
	    // this will be removed during the build due to dead-code elimination.
	    // Having this check will hopefully prevent typos during dev?
	    if ("production" !== 'production') {}
	    accelerate(e, dt);
	    inertia(e);
	  });
	}, 'phys-no-col');

	// this should be made more specific, such as "circleDraw" or "particleDraw" and should
	// receive some sort of drawing context as param.
	var drawSystem = System(function (entities, interp) {
	  // entities is passed in at call time from within.
	  // interp comes from manually calling the system below.
	  entities.forEach(function (e) {
	    if ("production" !== 'production') {}
	    console.log('x', e.ppos.x + (e.cpos.x - e.ppos.x) * interp);
	    console.log('y', e.ppos.y + (e.cpos.y - e.ppos.y) * interp);
	  });
	}, 'draw-console');

	// schedule a callback for a specified "best effort" time in the future.
	schedule(function (scheduledDelay, actualDelay) {
	  // destroy the entity after 3500 ms
	  // TODO: may need a "destroyEntityXSystem" that deallocs any props on the
	  // entity.
	  destroyEntity(e1);
	  console.log(e1);
	}, 3500);

	var _Loop = Loop({
	  drawTime: 1000 / 60,
	  updateTime: 1000 / 30,
	  update: function update(dt) {
	    tick(dt);
	    physicsSystem(dt);
	  },
	  draw: function draw(interp) {
	    drawSystem(interp);
	  },
	  onPanic: function onPanic() {
	    return console.log('panic!');
	  },
	  onFPS: function onFPS(fps) {
	    return console.log(fps, 'fps');
	  }
	});

	var stop = _Loop.stop;

}());