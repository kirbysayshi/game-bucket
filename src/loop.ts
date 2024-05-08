// This is basically an adaptation of
// https://github.com/IceCreamYou/MainLoop.js/blob/gh-pages/src/mainloop.js,
// with some removals / shrinking.

// Without a stable game loop, the game will run quite differently on older
// computers or browsers. In one it might be way easier, since it could run
// much slower! This helps to prevent that.

export type Ms = number;
export type InterpolationFactor = number;

export type LoopOptions = {
  drawTime: Ms;
  updateTime: Ms;
  draw: (interp: InterpolationFactor, dt: Ms) => void;
  update: (dt: Ms) => void;
  panicAt?: Ms;
  onPanic?: () => void;
  onFPS?: (fps: number) => void;
  accumulatorTick?: (accumulate: () => void) => number | null;
  cancelAccumulatorTick?: (handle: number) => void;
};

const noop = () => {
  return void 0;
};

export const createGameLoop = ({
  drawTime,
  updateTime,
  draw,
  update,
  panicAt = 10,
  onPanic = noop,
  onFPS = noop,
  accumulatorTick = window.requestAnimationFrame.bind(window),
  cancelAccumulatorTick = window.cancelAnimationFrame,
}: LoopOptions): { stop: () => void } => {
  const perf = performance;

  const drawMs = drawTime;
  const updateMs = updateTime;
  const pnow = perf.now.bind(perf);
  const rAF = accumulatorTick;

  let updateAccumulator = 0;
  let drawAccumulator = 0;
  let raf: null | number = null;
  let lastLoop = pnow();
  let lastFPS = pnow();
  let framesThisSecond = 0;
  let fps = 60;

  function accumulate() {
    const now = pnow();
    raf = rAF(accumulate);

    const dt = now - lastLoop;
    updateAccumulator += dt;
    drawAccumulator += dt;
    lastLoop = now;

    const shouldDraw = drawAccumulator - drawMs >= 0;
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
      // Drain the drawAccumulator. If the drawMs is mearly subtracted, the
      // accumulator can "fill up" with partial/remainder draw durations and then the draw starts
      // firing on every frame rather than at the requested rate.
      drawAccumulator = 0;
      // pass update-based interpolation factor for smooth animations
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

  const stop = () => {
    if (raf) cancelAccumulatorTick(raf);
  };

  return {
    stop,
  };
};
