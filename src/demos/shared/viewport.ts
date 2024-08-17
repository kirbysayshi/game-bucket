import { DPRCanvas, makeDPRCanvas } from '../../canvas';
import { usePrimaryCanvas } from '../../dom';
import { asWorldUnits, Camera2D, Pixels, WorldUnits, wv2 } from './Camera2d';

export class ViewportMan {
  v = deriveViewportCmp();
  camera = new Camera2D(asWorldUnits(100), asWorldUnits(100));
  private aborter = new AbortController();

  constructor(getRootElement: () => HTMLElement) {
    this.v = deriveViewportCmp();
    window.addEventListener(
      'resize',
      () => computeWindowResize(getRootElement),
      { signal: this.aborter.signal },
    );
    computeWindowResize(getRootElement);
  }

  destroy() {
    this.aborter.abort();
  }
}

type Viewport = {
  ratio: number;
  width: Pixels;
  height: Pixels;
  // vpWidth: WorldUnits<100>;
  // vpHeight: WorldUnits;
  dprCanvas: DPRCanvas;
};

export function deriveViewportCmp(): Viewport {
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

  const dprCanvas = makeDPRCanvas(width, height, usePrimaryCanvas());
  return {
    ratio,
    width: width as Pixels,
    height: height as Pixels,
    // vpWidth: asWorldUnits(100) as WorldUnits<100>,
    // vpHeight: asWorldUnits(100 / 0.6),
    dprCanvas,
  };
}

function computeWindowResize(getRootElement: () => HTMLElement) {
  const cmp = deriveViewportCmp();

  // TODO: consider hand-rolling a ctx.save/restore that only manages the
  // transform using .getTransform and .setTransform. Lots of perf time taken up
  // by .save/restore() currently.

  const root = getRootElement();
  root.style.width = cmp.width + 'px';

  // const toPx = (n: number) =>
  //   Math.floor((n / cmp.vpWidth) * cmp.dprCanvas.width);
  // cmp.dprCanvas.ctx.translate(
  //   toPx(cmp.camera.frustrum.x),
  //   toPx(cmp.camera.frustrum.y),
  // );
  // Force +y to be UP. Remember to reverse when writing text or image!
  // https://usefulangle.com/post/18/javascript-html5-canvas-solving-problem-of-inverted-text-when-y-axis-flipped
  // cmp.dprCanvas.ctx.scale(1, -1);
}
