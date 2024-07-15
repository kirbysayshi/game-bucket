import { Integratable, VelocityDerivable } from 'pocket-physics';

import {
  asViewportUnits,
  toPixelUnits,
  toProjectedPixels,
  ViewportCmp,
  ViewportUnits,
  ViewportUnitVector2,
} from './components/ViewportCmp';
import { BlackRGBA } from './theme';

export type Edge = { p0: ViewportUnitVector2; p1: ViewportUnitVector2 };

export function debugDrawIntegratable(
  vp: ViewportCmp,
  ctx: CanvasRenderingContext2D,
  cmp: VelocityDerivable,
  interp: number,
  radius: ViewportUnits = asViewportUnits(1),
  opacity: number = 0.2,
) {
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = `rgba(0,0,255,${opacity})`;
  ctx.arc(
    toProjectedPixels(
      vp,
      (cmp.ppos.x + (cmp.cpos.x - cmp.ppos.x) * interp) as ViewportUnits,
      'x',
    ),
    toProjectedPixels(
      vp,
      (cmp.ppos.y + (cmp.cpos.y - cmp.ppos.y) * interp) as ViewportUnits,
      'y',
    ),
    toPixelUnits(vp, radius),
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.restore();
}

export function debugDrawIntegratableRect(
  vp: ViewportCmp,
  ctx: CanvasRenderingContext2D,
  cmp: VelocityDerivable,
  interp: number,
  wh: ViewportUnitVector2,
  opacity = 0.2,
) {
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = `rgba(0,0,255,${opacity})`;

  const vpX = cmp.ppos.x + (cmp.cpos.x - cmp.ppos.x) * interp;
  const vpY = cmp.ppos.y + (cmp.cpos.y - cmp.ppos.y) * interp;
  const halfW = wh.x / 2;
  const halfH = wh.y / 2;

  const x = toProjectedPixels(vp, asViewportUnits(vpX - halfW), 'x');
  const y = toProjectedPixels(vp, asViewportUnits(vpY - halfH), 'y');
  const w = toPixelUnits(vp, wh.x);
  const h = toPixelUnits(vp, wh.y);

  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function debugDrawPoint(
  vp: ViewportCmp,
  ctx: CanvasRenderingContext2D,
  cmp: ViewportUnitVector2,
  interp: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = 'blue';
  ctx.arc(
    toProjectedPixels(vp, cmp.x, 'x'),
    toProjectedPixels(vp, cmp.y, 'y'),
    toPixelUnits(vp, asViewportUnits(1)),
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.restore();
}

function debugDrawEdge(
  vp: ViewportCmp,
  ctx: CanvasRenderingContext2D,
  edge: Edge,
  interp: number,
) {
  debugDrawPoint(vp, ctx, edge.p0, interp);
  debugDrawPoint(vp, ctx, edge.p1, interp);

  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = BlackRGBA;
  ctx.lineWidth = toPixelUnits(vp, asViewportUnits(0.5));
  ctx.moveTo(
    toProjectedPixels(vp, edge.p0.x, 'x'),
    toProjectedPixels(vp, edge.p0.y, 'y'),
  );
  ctx.lineTo(
    toProjectedPixels(vp, edge.p1.x, 'x'),
    toProjectedPixels(vp, edge.p1.y, 'y'),
  );
  ctx.stroke();
  ctx.restore();
}
