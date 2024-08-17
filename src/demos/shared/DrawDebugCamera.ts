import {
  asPixels,
  asViewportUnits,
  toPixelUnits,
  toProjectedPixels,
} from '../../components/ViewportCmp';
import { useDebugMode } from '../../query-string';
import { ViewportMan } from './viewport';

export const DrawDebugCamera = () => (vp: ViewportMan) => {
  if (!useDebugMode()) return;

  const {
    dprCanvas: { ctx },
  } = vp.v;

  ctx.save();
  // ctx.strokeStyle = 'purple';
  // ctx.fillStyle = 'green';
  // ctx.lineWidth = asPixels(5);

  // ctx.beginPath();
  // ctx.arc(
  //   toProjectedPixels(vp.v, camera.target.x, 'x'),
  //   toProjectedPixels(vp.v, camera.target.y, 'y'),
  //   toPixelUnits(vp.v, asViewportUnits(1)),
  //   0,
  //   Math.PI * 2,
  // );
  // ctx.fill();

  // ctx.strokeRect(
  //   toProjectedPixels(
  //     vp.v,
  //     asViewportUnits(camera.target.x - camera.frustrum.x),
  //     'x',
  //   ),
  //   toProjectedPixels(
  //     vp.v,
  //     asViewportUnits(camera.target.y - camera.frustrum.y),
  //     'y',
  //   ),
  //   toPixelUnits(vp.v, asViewportUnits(camera.frustrum.x * 2)),
  //   toPixelUnits(vp.v, asViewportUnits(camera.frustrum.y * 2)),
  // );

  ctx.restore();
};
