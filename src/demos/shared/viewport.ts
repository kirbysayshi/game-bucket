import { DPRCanvas, makeDPRCanvas } from '../../canvas';
import { usePrimaryCanvas } from '../../dom';
import { asWorldUnits, Camera2D, Pixels, WorldUnits, wv2 } from './Camera2d';

export class ViewportMan {
  camera = new Camera2D(asWorldUnits(100), asWorldUnits(100));
  canvas;
  private aborter = new AbortController();

  constructor(getRootElement: () => HTMLElement) {
    const initial = deriveCanvasSizeFromWindow();
    this.canvas = makeDPRCanvas(
      initial.width,
      initial.height,
      usePrimaryCanvas(),
    );

    window.addEventListener(
      'resize',
      () => handleWindowResize(getRootElement),
      { signal: this.aborter.signal },
    );
    handleWindowResize(getRootElement);
  }

  destroy() {
    this.aborter.abort();
  }
}

function deriveCanvasSizeFromWindow() {
  const ratio = 1;

  // if the window is taller than wide, use the window width for the width.
  // Otherwise, use the ratio to derive the width from the window height
  const width =
    window.innerWidth < window.innerHeight
      ? window.innerWidth
      : window.innerHeight * ratio;

  // if the window is taller than wide, use the window width to derive the height.
  // Otherwise, use the window height as the height.
  const height =
    window.innerWidth < window.innerHeight
      ? window.innerWidth / ratio
      : window.innerHeight;

  return { width, height };
}

function handleWindowResize(getRootElement: () => HTMLElement) {
  const cmp = deriveCanvasSizeFromWindow();

  // TODO: consider hand-rolling a ctx.save/restore that only manages the
  // transform using .getTransform and .setTransform. Lots of perf time taken up
  // by .save/restore() currently.

  const root = getRootElement();
  root.style.width = cmp.width + 'px';

  // Force +y to be UP. Remember to reverse when writing text or image!
  // https://usefulangle.com/post/18/javascript-html5-canvas-solving-problem-of-inverted-text-when-y-axis-flipped
  // cmp.dprCanvas.ctx.scale(1, -1);
}
