export default (cvs, width, height, scale) => {
  const ctx = cvs.getContext('2d');

  // TODO: probably need something in here to scale by devicePixelRatio / backingStoreRatio.
  // http://www.html5rocks.com/en/tutorials/canvas/hidpi/#toc-3

  cvs.style.margin = '0 auto';
  cvs.style.display = 'block';

  // These can be adjusted to allow for UI / controls if necessary.
  if (width < height) {
    cvs.style.height = '100vh';
  } else {
    cvs.style.width = '100vw';
  }

  cvs.width = width * scale;
  cvs.height = height * scale;

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