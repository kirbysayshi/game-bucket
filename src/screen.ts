export function Screen(
  cvs: HTMLCanvasElement,
  width: number,
  height: number,
  scale: number
) {
  const ctx = cvs.getContext("2d")!;

  // TODO: probably need something in here to scale by devicePixelRatio / backingStoreRatio.
  // http://www.html5rocks.com/en/tutorials/canvas/hidpi/#toc-3

  cvs.style.margin = "0 auto";
  cvs.style.display = "block";

  const parent =
    cvs.parentNode && cvs.parentNode.nodeName !== "BODY"
      ? (cvs.parentNode as HTMLElement)
      : null;

  if (parent) {
    parent.style.margin = "0 auto";
    parent.style.display = "block";
  }

  // These can be adjusted to allow for UI / controls if necessary.
  if (width < height) {
    cvs.style.height = "100%";
    if (parent) parent.style.height = "100%";
  } else {
    cvs.style.width = "100%";
    if (parent) parent.style.width = "100%";
  }

  width *= scale;
  height *= scale;

  cvs.width = width;
  cvs.height = height;

  // These need to be set each time the canvas resizes to ensure the backing
  // store retains crisp pixels.
  (ctx as any).webkitImageSmoothingEnabled = false;
  (ctx as any).msImageSmoothingEnabled = false;
  (ctx as any).mozImageSmoothingEnabled = false;
  ctx.imageSmoothingEnabled = false;

  const screen = {
    width,
    height,
    cvs,
    ctx,
    scale,
    destroy: () => {
      Object.keys(screen).map(k => delete (screen as any)[k]);
    }
  };

  return screen;
}
