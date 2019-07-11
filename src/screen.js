export default (cvs, width, height, scale) => {
  const ctx = cvs.getContext('2d');

  // TODO: probably need something in here to scale by devicePixelRatio / backingStoreRatio.
  // http://www.html5rocks.com/en/tutorials/canvas/hidpi/#toc-3

  cvs.style.margin = '0 auto';
  cvs.style.display = 'block';

  const parent = cvs.parentNode.nodeName !== 'BODY'
    ? cvs.parentNode
    : null;

  if (parent) {
    parent.style.margin = '0 auto';
    parent.style.display = 'block';
  }

  // These can be adjusted to allow for UI / controls if necessary.
  if (width < height) {
    cvs.style.height = '100%';
    if (parent) parent.style.height = '100%';
  } else {
    cvs.style.width = '100%';
    if (parent) parent.style.width = '100%';
  }

  width *= scale;
  height *= scale;

  cvs.width = width;
  cvs.height = height;

  // These need to be set each time the canvas resizes to ensure the backing
  // store retains crisp pixels.
  ctx.webkitImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.imageSmoothingEnabled = false;

  const screen = {
    width,
    height,
    cvs,
    ctx,
    scale,
    destroy: () => {
      Object.keys(screen).map(k => delete screen[k]);
    }
  };

  return screen;
}