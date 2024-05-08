import {
  asViewportUnits,
  toPixelUnits,
  toProjectedPixels,
} from '../components/ViewportCmp';
import { CES3C } from '../initialize-ces';
import { useDebugMode } from '../query-string';
import { assertDefinedFatal } from '../utils';

export const DrawDebugGridBackgroundSystem = () => (ces: CES3C) => {
  if (!useDebugMode()) return;
  const vp = ces.selectFirstData('viewport');
  assertDefinedFatal(vp);

  // draw lines every 5 viewport units?
  // given the camera position, "find" lines within the camera bounds

  const {
    camera,
    dprCanvas: { ctx },
  } = vp;

  const cellWidth = asViewportUnits(5);

  const leftmostVertical = Math.floor(
    (camera.target.x - camera.frustrum.x) / cellWidth
  );
  const rightmostVertical = Math.floor(
    (camera.target.x + camera.frustrum.x) / cellWidth
  );

  const topmostHorizontal = Math.floor(
    (camera.target.y + camera.frustrum.y) / cellWidth
  );
  const bottommostHorizontal = Math.floor(
    (camera.target.y - camera.frustrum.y) / cellWidth
  );

  ctx.save();
  ctx.strokeStyle = 'gray';

  // Draw the world origin
  ctx.fillStyle = 'lightblue';
  ctx.beginPath();
  ctx.arc(
    toProjectedPixels(vp, asViewportUnits(0), 'x'),
    toProjectedPixels(vp, asViewportUnits(0), 'y'),
    toPixelUnits(vp, asViewportUnits(4)),
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Draw vertical lines (X)
  for (let i = leftmostVertical; i <= rightmostVertical; i++) {
    const x = toProjectedPixels(vp, asViewportUnits(i * cellWidth), 'x');
    const y0 = toProjectedPixels(
      vp,
      asViewportUnits(camera.target.y + camera.frustrum.y),
      'y'
    );
    const y1 = toProjectedPixels(
      vp,
      asViewportUnits(camera.target.y - camera.frustrum.y),
      'y'
    );
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y1);
    ctx.stroke();
  }

  // Draw horizontal lines (Y)
  for (let i = bottommostHorizontal + 1; i <= topmostHorizontal; i++) {
    const y = toProjectedPixels(vp, asViewportUnits(i * cellWidth), 'y');
    const x0 = toProjectedPixels(
      vp,
      asViewportUnits(camera.target.x - camera.frustrum.x),
      'x'
    );
    const x1 = toProjectedPixels(
      vp,
      asViewportUnits(camera.target.x + camera.frustrum.x),
      'x'
    );
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
  }
  ctx.restore();
};
