// This is basically an adaptation of
// https://github.com/IceCreamYou/MainLoop.js/blob/gh-pages/src/mainloop.js,
// with some removals / shrinking.

// Without a stable game loop, the game will run quite differently on older
// computers or browsers. In one it might be way easier, since it could run
// much slower! This helps to prevent that.

type InterpolationFactor = number;

type LoopOptions = {
  drawTime: Ms;
  updateTime: Ms;
  draw: (interp: InterpolationFactor) => void;
  update: (dt: Ms) => void;
  panicAt?: Ms;
  onPanic?: () => void;
  onFPS?: (fps: number) => void;
}

export const Loop = ({
  drawTime,
  updateTime,
  draw,
  update,
  panicAt = 10,
  onPanic = () => {},
  onFPS = () => {},
}: LoopOptions) => {

  const perf = window.performance;

  const drawMs = drawTime;
  const updateMs = updateTime;
  const pnow = perf.now.bind(perf);
  const rAF = window.requestAnimationFrame.bind(window)

  let accumulator = 0;
  let raf: null | number = null;
  let lastLoop = pnow();
  let lastFPS = pnow();
  let framesThisSecond = 0;
  let fps = 60;

  (function accumulate () {
    const now = pnow();
    raf = rAF(accumulate);

    const dt = now - lastLoop;
    accumulator += dt;
    lastLoop = now;

    let shouldDraw = accumulator - drawMs >= 0;
    let step = Math.floor(accumulator / updateMs);

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

  }());

  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
  }

  return {
    stop,
  }
}
