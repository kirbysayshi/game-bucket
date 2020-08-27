export type DPRCanvas = {
  width: number;
  height: number;
  cvs: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  dpr: number;
};

export function makeDPRCanvas(
  width: number,
  height: number,
  cvs: HTMLCanvasElement
): DPRCanvas {
  const ctx = cvs.getContext("2d")!;

  // https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio

  const dpr = window.devicePixelRatio || 1;
  cvs.style.width = width + "px";
  cvs.style.height = height + "px";
  cvs.width = Math.round(width * dpr);
  cvs.height = Math.round(height * dpr);
  ctx.scale(dpr, dpr);

  // These need to be set each time the canvas resizes to ensure the backing
  // store retains crisp pixels.
  // TODO: is this necessary if the props are set in CSS?
  (ctx as any).webkitImageSmoothingEnabled = false;
  (ctx as any).msImageSmoothingEnabled = false;
  (ctx as any).mozImageSmoothingEnabled = false;
  ctx.imageSmoothingEnabled = false;

  return {
    width,
    height,
    cvs,
    ctx,
    dpr
  };
}

// function fillStyle(dpr: DPRCanvas, style: CanvasRenderingContext2D['fillStyle']) {
//   dpr.ctx.fillStyle = style;
// }
