export type DPRCanvas = {
  width: number;
  height: number;
  cvs: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  dpr: number;
};

declare interface XImageSmoothing {
  webkitImageSmoothingEnabled: boolean;
  msImageSmoothingEnabled: boolean;
  mozImageSmoothingEnabled: boolean;
}

export function makeDPRCanvas(
  width: number,
  height: number,
  cvs: HTMLCanvasElement
): DPRCanvas {
  const ctx = cvs.getContext('2d');

  if (!ctx) throw new Error('Could not create Context2d!');

  // https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio

  const dpr = window.devicePixelRatio || 1;
  cvs.style.width = width + 'px';
  cvs.style.height = height + 'px';
  cvs.width = Math.floor(width * dpr);
  cvs.height = Math.floor(height * dpr);
  ctx.scale(dpr, dpr);

  // These need to be set each time the canvas resizes to ensure the backing
  // store retains crisp pixels.
  // TODO: is this necessary if the props are set in CSS?
  (ctx as unknown as XImageSmoothing).webkitImageSmoothingEnabled = false;
  (ctx as unknown as XImageSmoothing).msImageSmoothingEnabled = false;
  (ctx as unknown as XImageSmoothing).mozImageSmoothingEnabled = false;
  ctx.imageSmoothingEnabled = false;

  return {
    width,
    height,
    cvs,
    ctx,
    dpr,
  };
}

// function fillStyle(dpr: DPRCanvas, style: CanvasRenderingContext2D['fillStyle']) {
//   dpr.ctx.fillStyle = style;
// }
