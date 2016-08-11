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

	var systemPropReqs = function systemPropReqs(entity) {
	  for (var _len3 = arguments.length, props = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
	    props[_key3 - 1] = arguments[_key3];
	  }

	  if (undefined !== 'production') {
	    props.forEach(function (k) {
	      if (![entity[k]]) {
	        throw new Error('required system prop ' + k + ' not found in entity ' + JSON.stringify(entity));
	      }
	    });
	  }
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
	    if (undefined !== 'production') {
	      systemPropReqs(e, 'cpos', 'ppos', 'acel');
	    }
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
	    if (undefined !== 'production') {
	      systemPropReqs(e, 'cpos', 'ppos');
	    }
	    console.log('x', e.ppos.x + (e.cpos.x - e.ppos.x) * interp);
	    console.log('y', e.ppos.y + (e.cpos.y - e.ppos.y) * interp);
	  });
	}, 'draw-console');

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

	// Turn this into dead-code during production

	if (undefined !== 'production') {
	  window.addEventListener('keydown', function (e) {
	    if (e.which === 27) {
	      stop();
	      console.log('HALT IN THE NAME OF SCIENCE');
	    }
	  }, false);
	}

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL1x1MDAwMGJhYmVsSGVscGVycyIsImxpYi9jZXMuanMiLCJsaWIvdGltZS5qcyIsImxpYi9sb29wLmpzIiwiLi4vLi4vLi4vLi4vLi4vXHUwMDAwY29tbW9uanNIZWxwZXJzIiwibm9kZV9tb2R1bGVzL3BvY2tldC1waHlzaWNzL3YyLmpzIiwibm9kZV9tb2R1bGVzL3BvY2tldC1waHlzaWNzL2FjY2VsZXJhdGUyZC5qcyIsIm5vZGVfbW9kdWxlcy9wb2NrZXQtcGh5c2ljcy9pbmVydGlhMmQuanMiLCJpbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgYmFiZWxIZWxwZXJzID0ge307XG52YXIgX3R5cGVvZiA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiID8gZnVuY3Rpb24gKG9iaikge1xuICByZXR1cm4gdHlwZW9mIG9iajtcbn0gOiBmdW5jdGlvbiAob2JqKSB7XG4gIHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7XG59O1xuXG5leHBvcnQgdmFyIGpzeCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIFJFQUNUX0VMRU1FTlRfVFlQRSA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBTeW1ib2wuZm9yICYmIFN5bWJvbC5mb3IoXCJyZWFjdC5lbGVtZW50XCIpIHx8IDB4ZWFjNztcbiAgcmV0dXJuIGZ1bmN0aW9uIGNyZWF0ZVJhd1JlYWN0RWxlbWVudCh0eXBlLCBwcm9wcywga2V5LCBjaGlsZHJlbikge1xuICAgIHZhciBkZWZhdWx0UHJvcHMgPSB0eXBlICYmIHR5cGUuZGVmYXVsdFByb3BzO1xuICAgIHZhciBjaGlsZHJlbkxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGggLSAzO1xuXG4gICAgaWYgKCFwcm9wcyAmJiBjaGlsZHJlbkxlbmd0aCAhPT0gMCkge1xuICAgICAgcHJvcHMgPSB7fTtcbiAgICB9XG5cbiAgICBpZiAocHJvcHMgJiYgZGVmYXVsdFByb3BzKSB7XG4gICAgICBmb3IgKHZhciBwcm9wTmFtZSBpbiBkZWZhdWx0UHJvcHMpIHtcbiAgICAgICAgaWYgKHByb3BzW3Byb3BOYW1lXSA9PT0gdm9pZCAwKSB7XG4gICAgICAgICAgcHJvcHNbcHJvcE5hbWVdID0gZGVmYXVsdFByb3BzW3Byb3BOYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIXByb3BzKSB7XG4gICAgICBwcm9wcyA9IGRlZmF1bHRQcm9wcyB8fCB7fTtcbiAgICB9XG5cbiAgICBpZiAoY2hpbGRyZW5MZW5ndGggPT09IDEpIHtcbiAgICAgIHByb3BzLmNoaWxkcmVuID0gY2hpbGRyZW47XG4gICAgfSBlbHNlIGlmIChjaGlsZHJlbkxlbmd0aCA+IDEpIHtcbiAgICAgIHZhciBjaGlsZEFycmF5ID0gQXJyYXkoY2hpbGRyZW5MZW5ndGgpO1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY2hpbGRBcnJheVtpXSA9IGFyZ3VtZW50c1tpICsgM107XG4gICAgICB9XG5cbiAgICAgIHByb3BzLmNoaWxkcmVuID0gY2hpbGRBcnJheTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgJCR0eXBlb2Y6IFJFQUNUX0VMRU1FTlRfVFlQRSxcbiAgICAgIHR5cGU6IHR5cGUsXG4gICAgICBrZXk6IGtleSA9PT0gdW5kZWZpbmVkID8gbnVsbCA6ICcnICsga2V5LFxuICAgICAgcmVmOiBudWxsLFxuICAgICAgcHJvcHM6IHByb3BzLFxuICAgICAgX293bmVyOiBudWxsXG4gICAgfTtcbiAgfTtcbn0oKTtcblxuZXhwb3J0IHZhciBhc3luY1RvR2VuZXJhdG9yID0gZnVuY3Rpb24gKGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGdlbiA9IGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIGZ1bmN0aW9uIHN0ZXAoa2V5LCBhcmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICB2YXIgaW5mbyA9IGdlbltrZXldKGFyZyk7XG4gICAgICAgICAgdmFyIHZhbHVlID0gaW5mby52YWx1ZTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpbmZvLmRvbmUpIHtcbiAgICAgICAgICByZXNvbHZlKHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHZhbHVlKS50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHN0ZXAoXCJuZXh0XCIsIHZhbHVlKTtcbiAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RlcChcInRocm93XCIsIGVycik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHN0ZXAoXCJuZXh0XCIpO1xuICAgIH0pO1xuICB9O1xufTtcblxuZXhwb3J0IHZhciBjbGFzc0NhbGxDaGVjayA9IGZ1bmN0aW9uIChpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHtcbiAgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpO1xuICB9XG59O1xuXG5leHBvcnQgdmFyIGNyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldO1xuICAgICAgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlO1xuICAgICAgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlO1xuICAgICAgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykge1xuICAgIGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7XG4gICAgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7XG4gICAgcmV0dXJuIENvbnN0cnVjdG9yO1xuICB9O1xufSgpO1xuXG5leHBvcnQgdmFyIGRlZmluZUVudW1lcmFibGVQcm9wZXJ0aWVzID0gZnVuY3Rpb24gKG9iaiwgZGVzY3MpIHtcbiAgZm9yICh2YXIga2V5IGluIGRlc2NzKSB7XG4gICAgdmFyIGRlc2MgPSBkZXNjc1trZXldO1xuICAgIGRlc2MuY29uZmlndXJhYmxlID0gZGVzYy5lbnVtZXJhYmxlID0gdHJ1ZTtcbiAgICBpZiAoXCJ2YWx1ZVwiIGluIGRlc2MpIGRlc2Mud3JpdGFibGUgPSB0cnVlO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwgZGVzYyk7XG4gIH1cblxuICByZXR1cm4gb2JqO1xufTtcblxuZXhwb3J0IHZhciBkZWZhdWx0cyA9IGZ1bmN0aW9uIChvYmosIGRlZmF1bHRzKSB7XG4gIHZhciBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoZGVmYXVsdHMpO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBrZXkgPSBrZXlzW2ldO1xuICAgIHZhciB2YWx1ZSA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoZGVmYXVsdHMsIGtleSk7XG5cbiAgICBpZiAodmFsdWUgJiYgdmFsdWUuY29uZmlndXJhYmxlICYmIG9ialtrZXldID09PSB1bmRlZmluZWQpIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwgdmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvYmo7XG59O1xuXG5leHBvcnQgdmFyIGRlZmluZVByb3BlcnR5ID0gZnVuY3Rpb24gKG9iaiwga2V5LCB2YWx1ZSkge1xuICBpZiAoa2V5IGluIG9iaikge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwge1xuICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgb2JqW2tleV0gPSB2YWx1ZTtcbiAgfVxuXG4gIHJldHVybiBvYmo7XG59O1xuXG52YXIgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldO1xuXG4gICAgZm9yICh2YXIga2V5IGluIHNvdXJjZSkge1xuICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHtcbiAgICAgICAgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGFyZ2V0O1xufTtcblxuZXhwb3J0IHZhciBnZXQgPSBmdW5jdGlvbiBnZXQob2JqZWN0LCBwcm9wZXJ0eSwgcmVjZWl2ZXIpIHtcbiAgaWYgKG9iamVjdCA9PT0gbnVsbCkgb2JqZWN0ID0gRnVuY3Rpb24ucHJvdG90eXBlO1xuICB2YXIgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0LCBwcm9wZXJ0eSk7XG5cbiAgaWYgKGRlc2MgPT09IHVuZGVmaW5lZCkge1xuICAgIHZhciBwYXJlbnQgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqZWN0KTtcblxuICAgIGlmIChwYXJlbnQgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBnZXQocGFyZW50LCBwcm9wZXJ0eSwgcmVjZWl2ZXIpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChcInZhbHVlXCIgaW4gZGVzYykge1xuICAgIHJldHVybiBkZXNjLnZhbHVlO1xuICB9IGVsc2Uge1xuICAgIHZhciBnZXR0ZXIgPSBkZXNjLmdldDtcblxuICAgIGlmIChnZXR0ZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICByZXR1cm4gZ2V0dGVyLmNhbGwocmVjZWl2ZXIpO1xuICB9XG59O1xuXG5leHBvcnQgdmFyIGluaGVyaXRzID0gZnVuY3Rpb24gKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7XG4gIGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gXCJmdW5jdGlvblwiICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCBcIiArIHR5cGVvZiBzdXBlckNsYXNzKTtcbiAgfVxuXG4gIHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwge1xuICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICB2YWx1ZTogc3ViQ2xhc3MsXG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfVxuICB9KTtcbiAgaWYgKHN1cGVyQ2xhc3MpIE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcykgOiBzdWJDbGFzcy5fX3Byb3RvX18gPSBzdXBlckNsYXNzO1xufTtcblxudmFyIF9pbnN0YW5jZW9mID0gZnVuY3Rpb24gKGxlZnQsIHJpZ2h0KSB7XG4gIGlmIChyaWdodCAhPSBudWxsICYmIHR5cGVvZiBTeW1ib2wgIT09IFwidW5kZWZpbmVkXCIgJiYgcmlnaHRbU3ltYm9sLmhhc0luc3RhbmNlXSkge1xuICAgIHJldHVybiByaWdodFtTeW1ib2wuaGFzSW5zdGFuY2VdKGxlZnQpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBsZWZ0IGluc3RhbmNlb2YgcmlnaHQ7XG4gIH1cbn07XG5cbmV4cG9ydCB2YXIgaW50ZXJvcFJlcXVpcmVEZWZhdWx0ID0gZnVuY3Rpb24gKG9iaikge1xuICByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDoge1xuICAgIGRlZmF1bHQ6IG9ialxuICB9O1xufTtcblxuZXhwb3J0IHZhciBpbnRlcm9wUmVxdWlyZVdpbGRjYXJkID0gZnVuY3Rpb24gKG9iaikge1xuICBpZiAob2JqICYmIG9iai5fX2VzTW9kdWxlKSB7XG4gICAgcmV0dXJuIG9iajtcbiAgfSBlbHNlIHtcbiAgICB2YXIgbmV3T2JqID0ge307XG5cbiAgICBpZiAob2JqICE9IG51bGwpIHtcbiAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIG5ld09ialtrZXldID0gb2JqW2tleV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgbmV3T2JqLmRlZmF1bHQgPSBvYmo7XG4gICAgcmV0dXJuIG5ld09iajtcbiAgfVxufTtcblxuZXhwb3J0IHZhciBuZXdBcnJvd0NoZWNrID0gZnVuY3Rpb24gKGlubmVyVGhpcywgYm91bmRUaGlzKSB7XG4gIGlmIChpbm5lclRoaXMgIT09IGJvdW5kVGhpcykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgaW5zdGFudGlhdGUgYW4gYXJyb3cgZnVuY3Rpb25cIik7XG4gIH1cbn07XG5cbmV4cG9ydCB2YXIgb2JqZWN0RGVzdHJ1Y3R1cmluZ0VtcHR5ID0gZnVuY3Rpb24gKG9iaikge1xuICBpZiAob2JqID09IG51bGwpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgZGVzdHJ1Y3R1cmUgdW5kZWZpbmVkXCIpO1xufTtcblxuZXhwb3J0IHZhciBvYmplY3RXaXRob3V0UHJvcGVydGllcyA9IGZ1bmN0aW9uIChvYmosIGtleXMpIHtcbiAgdmFyIHRhcmdldCA9IHt9O1xuXG4gIGZvciAodmFyIGkgaW4gb2JqKSB7XG4gICAgaWYgKGtleXMuaW5kZXhPZihpKSA+PSAwKSBjb250aW51ZTtcbiAgICBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGkpKSBjb250aW51ZTtcbiAgICB0YXJnZXRbaV0gPSBvYmpbaV07XG4gIH1cblxuICByZXR1cm4gdGFyZ2V0O1xufTtcblxuZXhwb3J0IHZhciBwb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuID0gZnVuY3Rpb24gKHNlbGYsIGNhbGwpIHtcbiAgaWYgKCFzZWxmKSB7XG4gICAgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFwidGhpcyBoYXNuJ3QgYmVlbiBpbml0aWFsaXNlZCAtIHN1cGVyKCkgaGFzbid0IGJlZW4gY2FsbGVkXCIpO1xuICB9XG5cbiAgcmV0dXJuIGNhbGwgJiYgKHR5cGVvZiBjYWxsID09PSBcIm9iamVjdFwiIHx8IHR5cGVvZiBjYWxsID09PSBcImZ1bmN0aW9uXCIpID8gY2FsbCA6IHNlbGY7XG59O1xuXG5leHBvcnQgdmFyIHNlbGZHbG9iYWwgPSB0eXBlb2YgZ2xvYmFsID09PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IGdsb2JhbDtcblxuZXhwb3J0IHZhciBzZXQgPSBmdW5jdGlvbiBzZXQob2JqZWN0LCBwcm9wZXJ0eSwgdmFsdWUsIHJlY2VpdmVyKSB7XG4gIHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmplY3QsIHByb3BlcnR5KTtcblxuICBpZiAoZGVzYyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdmFyIHBhcmVudCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmplY3QpO1xuXG4gICAgaWYgKHBhcmVudCAhPT0gbnVsbCkge1xuICAgICAgc2V0KHBhcmVudCwgcHJvcGVydHksIHZhbHVlLCByZWNlaXZlcik7XG4gICAgfVxuICB9IGVsc2UgaWYgKFwidmFsdWVcIiBpbiBkZXNjICYmIGRlc2Mud3JpdGFibGUpIHtcbiAgICBkZXNjLnZhbHVlID0gdmFsdWU7XG4gIH0gZWxzZSB7XG4gICAgdmFyIHNldHRlciA9IGRlc2Muc2V0O1xuXG4gICAgaWYgKHNldHRlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBzZXR0ZXIuY2FsbChyZWNlaXZlciwgdmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB2YWx1ZTtcbn07XG5cbmV4cG9ydCB2YXIgc2xpY2VkVG9BcnJheSA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gc2xpY2VJdGVyYXRvcihhcnIsIGkpIHtcbiAgICB2YXIgX2FyciA9IFtdO1xuICAgIHZhciBfbiA9IHRydWU7XG4gICAgdmFyIF9kID0gZmFsc2U7XG4gICAgdmFyIF9lID0gdW5kZWZpbmVkO1xuXG4gICAgdHJ5IHtcbiAgICAgIGZvciAodmFyIF9pID0gYXJyW1N5bWJvbC5pdGVyYXRvcl0oKSwgX3M7ICEoX24gPSAoX3MgPSBfaS5uZXh0KCkpLmRvbmUpOyBfbiA9IHRydWUpIHtcbiAgICAgICAgX2Fyci5wdXNoKF9zLnZhbHVlKTtcblxuICAgICAgICBpZiAoaSAmJiBfYXJyLmxlbmd0aCA9PT0gaSkgYnJlYWs7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBfZCA9IHRydWU7XG4gICAgICBfZSA9IGVycjtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKCFfbiAmJiBfaVtcInJldHVyblwiXSkgX2lbXCJyZXR1cm5cIl0oKTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIGlmIChfZCkgdGhyb3cgX2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIF9hcnI7XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKGFyciwgaSkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGFycikpIHtcbiAgICAgIHJldHVybiBhcnI7XG4gICAgfSBlbHNlIGlmIChTeW1ib2wuaXRlcmF0b3IgaW4gT2JqZWN0KGFycikpIHtcbiAgICAgIHJldHVybiBzbGljZUl0ZXJhdG9yKGFyciwgaSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIGF0dGVtcHQgdG8gZGVzdHJ1Y3R1cmUgbm9uLWl0ZXJhYmxlIGluc3RhbmNlXCIpO1xuICAgIH1cbiAgfTtcbn0oKTtcblxuZXhwb3J0IHZhciBzbGljZWRUb0FycmF5TG9vc2UgPSBmdW5jdGlvbiAoYXJyLCBpKSB7XG4gIGlmIChBcnJheS5pc0FycmF5KGFycikpIHtcbiAgICByZXR1cm4gYXJyO1xuICB9IGVsc2UgaWYgKFN5bWJvbC5pdGVyYXRvciBpbiBPYmplY3QoYXJyKSkge1xuICAgIHZhciBfYXJyID0gW107XG5cbiAgICBmb3IgKHZhciBfaXRlcmF0b3IgPSBhcnJbU3ltYm9sLml0ZXJhdG9yXSgpLCBfc3RlcDsgIShfc3RlcCA9IF9pdGVyYXRvci5uZXh0KCkpLmRvbmU7KSB7XG4gICAgICBfYXJyLnB1c2goX3N0ZXAudmFsdWUpO1xuXG4gICAgICBpZiAoaSAmJiBfYXJyLmxlbmd0aCA9PT0gaSkgYnJlYWs7XG4gICAgfVxuXG4gICAgcmV0dXJuIF9hcnI7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgYXR0ZW1wdCB0byBkZXN0cnVjdHVyZSBub24taXRlcmFibGUgaW5zdGFuY2VcIik7XG4gIH1cbn07XG5cbmV4cG9ydCB2YXIgdGFnZ2VkVGVtcGxhdGVMaXRlcmFsID0gZnVuY3Rpb24gKHN0cmluZ3MsIHJhdykge1xuICByZXR1cm4gT2JqZWN0LmZyZWV6ZShPYmplY3QuZGVmaW5lUHJvcGVydGllcyhzdHJpbmdzLCB7XG4gICAgcmF3OiB7XG4gICAgICB2YWx1ZTogT2JqZWN0LmZyZWV6ZShyYXcpXG4gICAgfVxuICB9KSk7XG59O1xuXG5leHBvcnQgdmFyIHRhZ2dlZFRlbXBsYXRlTGl0ZXJhbExvb3NlID0gZnVuY3Rpb24gKHN0cmluZ3MsIHJhdykge1xuICBzdHJpbmdzLnJhdyA9IHJhdztcbiAgcmV0dXJuIHN0cmluZ3M7XG59O1xuXG5leHBvcnQgdmFyIHRlbXBvcmFsUmVmID0gZnVuY3Rpb24gKHZhbCwgbmFtZSwgdW5kZWYpIHtcbiAgaWYgKHZhbCA9PT0gdW5kZWYpIHtcbiAgICB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IobmFtZSArIFwiIGlzIG5vdCBkZWZpbmVkIC0gdGVtcG9yYWwgZGVhZCB6b25lXCIpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB2YWw7XG4gIH1cbn07XG5cbmV4cG9ydCB2YXIgdGVtcG9yYWxVbmRlZmluZWQgPSB7fTtcblxuZXhwb3J0IHZhciB0b0FycmF5ID0gZnVuY3Rpb24gKGFycikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcnIpID8gYXJyIDogQXJyYXkuZnJvbShhcnIpO1xufTtcblxuZXhwb3J0IHZhciB0b0NvbnN1bWFibGVBcnJheSA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkoYXJyKSkge1xuICAgIGZvciAodmFyIGkgPSAwLCBhcnIyID0gQXJyYXkoYXJyLmxlbmd0aCk7IGkgPCBhcnIubGVuZ3RoOyBpKyspIGFycjJbaV0gPSBhcnJbaV07XG5cbiAgICByZXR1cm4gYXJyMjtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShhcnIpO1xuICB9XG59O1xuXG5iYWJlbEhlbHBlcnM7XG5cbmV4cG9ydCB7IF90eXBlb2YgYXMgdHlwZW9mLCBfZXh0ZW5kcyBhcyBleHRlbmRzLCBfaW5zdGFuY2VvZiBhcyBpbnN0YW5jZW9mIH0iLCJsZXQga25vd25UYWdzID0ge307XG5sZXQgTEFTVF9FX0lEID0gMDtcblxuZXhwb3J0IGNvbnN0IEVudGl0eSA9IChwcm9wcykgPT4ge1xuICBjb25zdCBlID0ge1xuICAgIGlkOiBMQVNUX0VfSUQrKyxcbiAgICAuLi5wcm9wcyxcbiAgfVxuXG4gIHByb3BzLnRhZ3MgJiYgcHJvcHMudGFncy5mb3JFYWNoKHAgPT4ge1xuICAgIGtub3duVGFnc1twXSA9IGtub3duVGFnc1twXSB8fCBbXTtcbiAgICBrbm93blRhZ3NbcF0ucHVzaChlKTtcbiAgfSk7XG5cbiAgcmV0dXJuIGU7XG59XG5cbmV4cG9ydCBjb25zdCBTeXN0ZW0gPSAoYWN0aW9uLCAuLi50YWdzKSA9PiAoLi4uYXJncykgPT4ge1xuICBjb25zdCBlbnRpdGllcyA9IHRhZ3MucmVkdWNlKChmb3VuZHMsIHQpID0+IHtcbiAgICBjb25zdCB0YWdnZWQgPSBrbm93blRhZ3NbdF07XG4gICAgdGFnZ2VkLmZvckVhY2goZSA9PiB7XG4gICAgICBpZiAoZm91bmRzW2UuaWRdKSByZXR1cm47XG4gICAgICAvLyBPbmx5IGdpdmUgdGhlIGVudGl0eSB0byB0aGlzIHN5c3RlbSBpZiB0aGUgZW50aXR5IGhhcyBldmVyeSB0YWcgdGhlXG4gICAgICAvLyBzeXN0ZW0gcmVxdWlyZXMuXG4gICAgICBpZiAodGFncy5ldmVyeShzdGFnID0+IChlLnRhZ3MuaW5kZXhPZihzdGFnKSA+IC0xKSkpIHtcbiAgICAgICAgZm91bmRzW2UuaWRdID0gZTtcbiAgICAgIH1cbiAgICB9KVxuICAgIHJldHVybiBmb3VuZHNcbiAgfSwge30pXG5cbiAgLy8gcGFzcyB0aGUgLi4uYXJncyBmcm9tIHRoZSBpbnZvY2F0aW9uIG9mIHRoZSBzeXN0ZW0gdG8gdGhlIGFjdGlvbi5cbiAgYWN0aW9uKE9iamVjdC5rZXlzKGVudGl0aWVzKS5tYXAoaWQgPT4gZW50aXRpZXNbaWRdKSwgLi4uYXJncyk7XG59XG5cbmV4cG9ydCBjb25zdCBzeXN0ZW1Qcm9wUmVxcyA9IChlbnRpdHksIC4uLnByb3BzKSA9PiB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgcHJvcHMuZm9yRWFjaChrID0+IHtcbiAgICAgIGlmICghW2VudGl0eVtrXV0pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGByZXF1aXJlZCBzeXN0ZW0gcHJvcCAke2t9IG5vdCBmb3VuZCBpbiBlbnRpdHkgJHtKU09OLnN0cmluZ2lmeShlbnRpdHkpfWApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBkZXN0cm95RW50aXR5ID0gKGUpID0+IHtcbiAgLy8gVE9ETzogdGhpcyBtYXkgbmVlZCB0byBiZSBhIFwic2NoZWR1bGVEZXN0cm95RW50aXR5XCJcbiAgZS50YWdzLmZvckVhY2godCA9PiB7XG4gICAgY29uc3QgdGFnZ2VkID0ga25vd25UYWdzW3RdO1xuICAgIGNvbnN0IGlkeCA9IHRhZ2dlZC5pbmRleE9mKGUpO1xuICAgIGlmIChpZHggPT09IC0xKSByZXR1cm47XG4gICAgdGFnZ2VkLnNwbGljZShpZHgsIDEpO1xuICB9KTtcbiAgZS50YWdzLmxlbmd0aCA9IDA7XG4gIGUuZGVzdHJveWVkID0gdHJ1ZTtcbn1cblxuZXhwb3J0IGNvbnN0IHJlc2V0ID0gKCkgPT4ge1xuICBPYmplY3Qua2V5cyhrbm93blRhZ3MpLmZvckVhY2godCA9PiB7XG4gICAgY29uc3QgZW50aXRpZXMgPSBrbm93blRhZ3NbdF07XG4gICAgZW50aXRpZXMuZm9yRWFjaChkZXN0cm95RW50aXR5KTtcbiAgICBrbm93blRhZ3MubGVuZ3RoID0gMDtcbiAgICBkZWxldGUga25vd25UYWdzW3RdO1xuICB9KTtcblxuICBMQVNUX0VfSUQgPSAwO1xufVxuIiwibGV0IExBU1RfSUQgPSAwO1xubGV0IHRhc2tzID0gW107XG5cbmV4cG9ydCBjb25zdCBzY2hlZHVsZSA9IChhY3Rpb24sIGRlbGF5KSA9PiB7XG4gIHRhc2tzLnB1c2goe1xuICAgIGlkOiArK0xBU1RfSUQsXG4gICAgYWN0aW9uLFxuICAgIGRlbGF5LFxuICAgIGFnZTogMCxcbiAgfSk7XG59XG5cbmV4cG9ydCBjb25zdCB1bnNjaGVkdWxlID0gKGlkKSA9PiB7XG4gIGNvbnN0IGlkeCA9IHRhc2tzLmZpbmRJbmRleCh0ID0+IHQuaWQgPT09IGlkKTtcbiAgaWYgKGlkeCA9PT0gLTEpIHJldHVybjtcbiAgdGFza3Muc3BsaWNlKGlkeCwgMSk7XG59XG5cbmV4cG9ydCBjb25zdCB0aWNrID0gKGR0ID0gMSkgPT4ge1xuICAvLyBjb3B5IHRoZSBhcnJheSBpbiBjYXNlIHNvbWUgdGFza3MgbmVlZCB0byBiZSBleHB1bmdlZC5cbiAgdGFza3Muc2xpY2UoKS5mb3JFYWNoKCh0LCBpZHgpID0+IHtcbiAgICB0LmFnZSArPSBkdDtcblxuICAgIGlmICh0LmFnZSA+PSB0LmRlbGF5KSB7XG4gICAgICB0YXNrcy5zcGxpY2UoaWR4LCAxKTtcbiAgICAgIHQuYWN0aW9uKHQuZGVsYXksIHQuYWdlKTtcbiAgICB9XG4gIH0pO1xufVxuXG5leHBvcnQgY29uc3QgcmVzZXQgPSAoKSA9PiB7XG4gIExBU1RfSUQgPSAwO1xuICB0YXNrcy5sZW5ndGggPSAwO1xufVxuIiwiLy8gVGhpcyBpcyBiYXNpY2FsbHkgYW4gYWRhcHRhdGlvbiBvZlxuLy8gaHR0cHM6Ly9naXRodWIuY29tL0ljZUNyZWFtWW91L01haW5Mb29wLmpzL2Jsb2IvZ2gtcGFnZXMvc3JjL21haW5sb29wLmpzLFxuLy8gd2l0aCBzb21lIHJlbW92YWxzIC8gc2hyaW5raW5nLlxuXG5leHBvcnQgY29uc3QgTG9vcCA9ICh7XG4gIGRyYXdUaW1lLFxuICB1cGRhdGVUaW1lLFxuICBkcmF3LFxuICB1cGRhdGUsXG4gIHBhbmljQXQgPSAxMCxcbiAgb25QYW5pYyA9ICgpID0+IHt9LFxuICBvbkZQUyA9ICgpID0+IHt9LFxufSkgPT4ge1xuXG4gIGNvbnN0IHBlcmYgPSB3aW5kb3cucGVyZm9ybWFuY2U7XG5cbiAgY29uc3QgZHJhd01zID0gZHJhd1RpbWU7XG4gIGNvbnN0IHVwZGF0ZU1zID0gdXBkYXRlVGltZTtcbiAgY29uc3QgcG5vdyA9IHBlcmYubm93LmJpbmQocGVyZik7XG4gIGNvbnN0IHJBRiA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUuYmluZCh3aW5kb3cpXG5cbiAgbGV0IGFjY3VtdWxhdG9yID0gMDtcbiAgbGV0IHJhZiA9IG51bGw7XG4gIGxldCBsYXN0TG9vcCA9IHBub3coKTtcbiAgbGV0IGxhc3RGUFMgPSBwbm93KCk7XG4gIGxldCBmcmFtZXNUaGlzU2Vjb25kID0gMDtcbiAgbGV0IGZwcyA9IDA7XG5cbiAgKGZ1bmN0aW9uIGFjY3VtdWxhdGUgKG5vdykge1xuICAgIHJhZiA9IHJBRihhY2N1bXVsYXRlKTtcblxuICAgIGNvbnN0IGR0ID0gbm93IC0gbGFzdExvb3A7XG4gICAgYWNjdW11bGF0b3IgKz0gZHQ7XG4gICAgbGFzdExvb3AgPSBub3c7XG5cbiAgICBsZXQgc2hvdWxkRHJhdyA9IGFjY3VtdWxhdG9yIC0gZHJhd01zID49IDA7XG4gICAgbGV0IHN0ZXAgPSBNYXRoLmZsb29yKGFjY3VtdWxhdG9yIC8gdXBkYXRlTXMpO1xuXG4gICAgaWYgKHN0ZXAgPj0gcGFuaWNBdCkge1xuICAgICAgYWNjdW11bGF0b3IgPSAwO1xuICAgICAgbGFzdExvb3AgPSBwbm93KCk7XG4gICAgICBvblBhbmljKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgd2hpbGUgKHN0ZXAtLSA+IDApIHtcbiAgICAgIGFjY3VtdWxhdG9yIC09IHVwZGF0ZU1zO1xuICAgICAgdXBkYXRlKHVwZGF0ZU1zKTtcbiAgICB9XG5cbiAgICBpZiAoc2hvdWxkRHJhdykge1xuICAgICAgLy8gcGFzcyBpbnRlcnBvbGF0aW9uIGZhY3RvciBmb3Igc21vb3RoIGFuaW1hdGlvbnNcbiAgICAgIGRyYXcoYWNjdW11bGF0b3IgLyBkcmF3TXMpO1xuICAgIH1cblxuICAgIGZyYW1lc1RoaXNTZWNvbmQgKz0gMTtcblxuICAgIGlmIChsYXN0RlBTICsgMTAwMCA8PSBub3cpIHtcbiAgICAgIGZwcyA9IDAuMjUgKiBmcmFtZXNUaGlzU2Vjb25kICsgMC43NSAqIGZwcztcbiAgICAgIGZyYW1lc1RoaXNTZWNvbmQgPSAwO1xuICAgICAgbGFzdEZQUyA9IG5vdztcbiAgICAgIG9uRlBTKGZwcyk7XG4gICAgfVxuXG4gIH0ocG5vdygpKSk7XG5cbiAgY29uc3Qgc3RvcCA9ICgpID0+IHtcbiAgICBpZiAocmFmKSBjYW5jZWxBbmltYXRpb25GcmFtZShyYWYpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzdG9wLFxuICB9XG59XG4iLCJcbmV4cG9ydCB2YXIgY29tbW9uanNHbG9iYWwgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnID8gc2VsZiA6IHt9XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDb21tb25qc01vZHVsZShmbiwgbW9kdWxlKSB7XG5cdHJldHVybiBtb2R1bGUgPSB7IGV4cG9ydHM6IHt9IH0sIGZuKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMpLCBtb2R1bGUuZXhwb3J0cztcbn0iLCJmdW5jdGlvbiB2Mih4LCB5KSB7XG4gIHJldHVybiB7IHg6IHggfHwgMCwgeTogeSB8fCAwIH1cbn1cblxudjIuY29weSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICBvdXQueCA9IGEueDtcbiAgb3V0LnkgPSBhLnk7XG4gIHJldHVybiBvdXQ7XG59XG5cbnYyLnNldCA9IGZ1bmN0aW9uKG91dCwgeCwgeSkge1xuICBvdXQueCA9IHg7XG4gIG91dC55ID0geTtcbiAgcmV0dXJuIG91dDtcbn1cblxudjIuYWRkID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gIG91dC54ID0gYS54ICsgYi54O1xuICBvdXQueSA9IGEueSArIGIueTtcbiAgcmV0dXJuIG91dDtcbn1cblxudjIuc3ViID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gIG91dC54ID0gYS54IC0gYi54O1xuICBvdXQueSA9IGEueSAtIGIueTtcbiAgcmV0dXJuIG91dDtcbn1cblxudjIuc2NhbGUgPSBmdW5jdGlvbihvdXQsIGEsIGZhY3Rvcikge1xuICBvdXQueCA9IGEueCAqIGZhY3RvcjtcbiAgb3V0LnkgPSBhLnkgKiBmYWN0b3I7XG4gIHJldHVybiBvdXQ7XG59XG5cbnYyLmRpc3RhbmNlID0gZnVuY3Rpb24odjEsIHYyKSB7XG4gIHZhciB4ID0gdjEueCAtIHYyLng7XG4gIHZhciB5ID0gdjEueSAtIHYyLnk7XG4gIHJldHVybiBNYXRoLnNxcnQoeCp4ICsgeSp5KTtcbn1cblxudjIuZGlzdGFuY2UyID0gZnVuY3Rpb24odjEsIHYyKSB7XG4gIHZhciB4ID0gdjEueCAtIHYyLng7XG4gIHZhciB5ID0gdjEueSAtIHYyLnk7XG4gIHJldHVybiB4KnggKyB5Knk7XG59XG5cbnYyLm1hZ25pdHVkZSA9IGZ1bmN0aW9uKHYxKSB7XG4gIHZhciB4ID0gdjEueDtcbiAgdmFyIHkgPSB2MS55O1xuICByZXR1cm4gTWF0aC5zcXJ0KHgqeCArIHkqeSk7XG59XG5cbnYyLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICB2YXIgeCA9IGEueDtcbiAgdmFyIHkgPSBhLnk7XG4gIHZhciBsZW4gPSB4KnggKyB5Knk7XG4gIGlmIChsZW4gPiAwKSB7XG4gICAgbGVuID0gMSAvIE1hdGguc3FydChsZW4pO1xuICAgIG91dC54ID0gYS54ICogbGVuO1xuICAgIG91dC55ID0gYS55ICogbGVuO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdjI7XG4iLCJ2YXIgdjIgPSByZXF1aXJlKCcuL3YyJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oY21wLCBkdCkge1xuICAvLyBhcHBseSBhY2NlbGVyYXRpb24gdG8gY3VycmVudCBwb3NpdGlvbiwgY29udmVydCBkdCB0byBzZWNvbmRzXG4gIGNtcC5jcG9zLnggKz0gY21wLmFjZWwueCAqIGR0ICogZHQgKiAwLjAwMTtcbiAgY21wLmNwb3MueSArPSBjbXAuYWNlbC55ICogZHQgKiBkdCAqIDAuMDAxO1xuXG4gIC8vIHJlc2V0IGFjY2VsZXJhdGlvblxuICB2Mi5zZXQoY21wLmFjZWwsIDAsIDApO1xufSIsInZhciB2MiA9IHJlcXVpcmUoJy4vdjInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihjbXApIHtcbiAgdmFyIHggPSBjbXAuY3Bvcy54KjIgLSBjbXAucHBvcy54XG4gICAgLCB5ID0gY21wLmNwb3MueSoyIC0gY21wLnBwb3MueTtcblxuICB2Mi5zZXQoY21wLnBwb3MsIGNtcC5jcG9zLngsIGNtcC5jcG9zLnkpO1xuICB2Mi5zZXQoY21wLmNwb3MsIHgsIHkpO1xufSIsImltcG9ydCB7XG4gIEVudGl0eSxcbiAgU3lzdGVtLFxuICBkZXN0cm95RW50aXR5LFxuICBzeXN0ZW1Qcm9wUmVxc1xufSBmcm9tICcuL2xpYi9jZXMnO1xuaW1wb3J0IHtcbiAgc2NoZWR1bGUsXG4gIHRpY2ssXG59IGZyb20gJy4vbGliL3RpbWUnO1xuaW1wb3J0IHsgTG9vcCB9IGZyb20gJy4vbGliL2xvb3AnO1xuXG5pbXBvcnQgYWNjZWxlcmF0ZSBmcm9tICdwb2NrZXQtcGh5c2ljcy9hY2NlbGVyYXRlMmQnO1xuaW1wb3J0IGluZXJ0aWEgZnJvbSAncG9ja2V0LXBoeXNpY3MvaW5lcnRpYTJkJztcblxuLy8gVGhpcyBpcyBhbiBcImVudGl0eVwiLCBha2EgYSBiYWcgb2YgZGF0YSwgd2l0aCBhIHNwZWNpYWwgYXJyYXkgbmFtZWQgYHRhZ3NgLlxuLy8gVGhlc2UgdGFncyBtYXJrIGFuIGVudGl0eSBhcyBwcm9jZXNzYWJsZSBieSBhIHN5c3RlbSB0aGF0IGhhcyBtYXRjaGluZyB0YWdzLlxuLy8gVGhlIHN5c3RlbSB3aWxsIG9ubHkgaW52b2tlIGl0cyByb3V0aW5lIGlmIGFuIGVudGl0eSBvciBlbnRpdGllcyBoYXMgZXZlcnlcbi8vIHRhZyB0aGUgc3lzdGVtIHJlcXVpcmVzLlxuY29uc3QgZTEgPSBFbnRpdHkoe1xuICB0YWdzOiBbJ3BoeXMtbm8tY29sJywgJ2RyYXctY29uc29sZSddLFxuICBjcG9zOiB7IHg6IDAsIHk6IDAgfSxcbiAgcHBvczogeyB4OiAwLCB5OiAwIH0sXG4gIGFjZWw6IHsgeDogMTAsIHk6IDAgfSxcbn0pO1xuXG5jb25zdCBwaHlzaWNzU3lzdGVtID0gU3lzdGVtKChlbnRpdGllcywgZHQpID0+IHtcbiAgLy8gZW50aXRpZXMgaXMgcGFzc2VkIGluIGF0IGNhbGwgdGltZSBmcm9tIHdpdGhpbi5cbiAgLy8gZHQgY29tZXMgZnJvbSBjYWxsaW5nIHRoZSBzeXN0ZW0gbWFudWFsbHkgYmVsb3cuXG4gIGVudGl0aWVzLmZvckVhY2goZSA9PiB7XG4gICAgLy8gdGhpcyB3aWxsIGJlIHJlbW92ZWQgZHVyaW5nIHRoZSBidWlsZCBkdWUgdG8gZGVhZC1jb2RlIGVsaW1pbmF0aW9uLlxuICAgIC8vIEhhdmluZyB0aGlzIGNoZWNrIHdpbGwgaG9wZWZ1bGx5IHByZXZlbnQgdHlwb3MgZHVyaW5nIGRldj9cbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykgeyBzeXN0ZW1Qcm9wUmVxcyhlLCAnY3BvcycsICdwcG9zJywgJ2FjZWwnKTsgfVxuICAgIGFjY2VsZXJhdGUoZSwgZHQpO1xuICAgIGluZXJ0aWEoZSk7XG4gIH0pXG59LCAncGh5cy1uby1jb2wnKTtcblxuLy8gdGhpcyBzaG91bGQgYmUgbWFkZSBtb3JlIHNwZWNpZmljLCBzdWNoIGFzIFwiY2lyY2xlRHJhd1wiIG9yIFwicGFydGljbGVEcmF3XCIgYW5kIHNob3VsZFxuLy8gcmVjZWl2ZSBzb21lIHNvcnQgb2YgZHJhd2luZyBjb250ZXh0IGFzIHBhcmFtLlxuY29uc3QgZHJhd1N5c3RlbSA9IFN5c3RlbSgoZW50aXRpZXMsIGludGVycCkgPT4ge1xuICAvLyBlbnRpdGllcyBpcyBwYXNzZWQgaW4gYXQgY2FsbCB0aW1lIGZyb20gd2l0aGluLlxuICAvLyBpbnRlcnAgY29tZXMgZnJvbSBtYW51YWxseSBjYWxsaW5nIHRoZSBzeXN0ZW0gYmVsb3cuXG4gIGVudGl0aWVzLmZvckVhY2goZSA9PiB7XG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHsgc3lzdGVtUHJvcFJlcXMoZSwgJ2Nwb3MnLCAncHBvcycpOyB9XG4gICAgY29uc29sZS5sb2coJ3gnLCBlLnBwb3MueCArIChlLmNwb3MueCAtIGUucHBvcy54KSAqIGludGVycCk7XG4gICAgY29uc29sZS5sb2coJ3knLCBlLnBwb3MueSArIChlLmNwb3MueSAtIGUucHBvcy55KSAqIGludGVycCk7XG4gIH0pXG59LCAnZHJhdy1jb25zb2xlJyk7XG5cblxuXG5zY2hlZHVsZSgoc2NoZWR1bGVkRGVsYXksIGFjdHVhbERlbGF5KSA9PiB7XG4gIC8vIGRlc3Ryb3kgdGhlIGVudGl0eSBhZnRlciAzNTAwIG1zXG4gIC8vIFRPRE86IG1heSBuZWVkIGEgXCJkZXN0cm95RW50aXR5WFN5c3RlbVwiIHRoYXQgZGVhbGxvY3MgYW55IHByb3BzIG9uIHRoZVxuICAvLyBlbnRpdHkuXG4gIGRlc3Ryb3lFbnRpdHkoZTEpO1xuICBjb25zb2xlLmxvZyhlMSk7XG59LCAzNTAwKTtcblxuY29uc3QgeyBzdG9wIH0gPSBMb29wKHtcbiAgZHJhd1RpbWU6IDEwMDAgLyA2MCxcbiAgdXBkYXRlVGltZTogMTAwMCAvIDMwLFxuICB1cGRhdGU6IChkdCkgPT4ge1xuICAgIHRpY2soZHQpO1xuICAgIHBoeXNpY3NTeXN0ZW0oZHQpO1xuICB9LFxuICBkcmF3OiAoaW50ZXJwKSA9PiB7XG4gICAgZHJhd1N5c3RlbShpbnRlcnApO1xuICB9LFxuICBvblBhbmljOiAoKSA9PiBjb25zb2xlLmxvZygncGFuaWMhJyksXG4gIG9uRlBTOiAoZnBzKSA9PiBjb25zb2xlLmxvZyhmcHMsICdmcHMnKSxcbn0pO1xuXG4vLyBUdXJuIHRoaXMgaW50byBkZWFkLWNvZGUgZHVyaW5nIHByb2R1Y3Rpb25cbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZSA9PiB7XG4gICAgaWYgKGUud2hpY2ggPT09IDI3KSB7XG4gICAgICBzdG9wKCk7XG4gICAgICBjb25zb2xlLmxvZygnSEFMVCBJTiBUSEUgTkFNRSBPRiBTQ0lFTkNFJyk7XG4gICAgfVxuICB9LCBmYWxzZSk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0NBZ0pBLElBQUksUUFBUSxHQUFHLE1BQU0sQ0FBQyxNQUFNLElBQUksVUFBVSxNQUFNLEVBQUU7QUFDbEQsQ0FBQSxFQUFFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQzdDLENBQUEsSUFBSSxJQUFJLE1BQU0sR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRTlCLENBQUEsSUFBSSxLQUFLLElBQUksR0FBRyxJQUFJLE1BQU0sRUFBRTtBQUM1QixDQUFBLE1BQU0sSUFBSSxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFF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