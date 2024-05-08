import {
  asPixels,
  asViewportUnits,
  toPixelUnits,
  toProjectedPixels,
} from '../components/ViewportCmp';
import { CES3C } from '../initialize-ces';
import { useDebugMode } from '../query-string';
import { assertDefinedFatal } from '../utils';

export const DrawDebugCameraSystem = () => (ces: CES3C) => {
  if (!useDebugMode()) return;
  const vp = ces.selectFirstData('viewport');
  assertDefinedFatal(vp);

  const {
    camera,
    dprCanvas: { ctx },
  } = vp;

  ctx.save();
  ctx.strokeStyle = 'purple';
  ctx.fillStyle = 'green';
  ctx.lineWidth = asPixels(5);

  ctx.beginPath();
  ctx.arc(
    toProjectedPixels(vp, camera.target.x, 'x'),
    toProjectedPixels(vp, camera.target.y, 'y'),
    toPixelUnits(vp, asViewportUnits(1)),
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.strokeRect(
    toProjectedPixels(
      vp,
      asViewportUnits(camera.target.x - camera.frustrum.x),
      'x'
    ),
    toProjectedPixels(
      vp,
      asViewportUnits(camera.target.y - camera.frustrum.y),
      'y'
    ),
    toPixelUnits(vp, asViewportUnits(camera.frustrum.x * 2)),
    toPixelUnits(vp, asViewportUnits(camera.frustrum.y * 2))
  );

  ctx.restore();
};
