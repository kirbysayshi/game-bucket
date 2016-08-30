export default (cvs, width, height) => {
  const ctx = cvs.getContext('2d');

  cvs.style.margin = '0 auto';
  cvs.style.display = 'block';

  // These can be adjusted to allow for UI / controls if necessary.
  if (width < height) {
    cvs.style.height = '100vh';
  } else {
    cvs.style.width = '100vw';
  }

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
    destroy: () => {
      Object.keys(screen).map(k => delete screen[k]);
    }
  };

  return screen;
}