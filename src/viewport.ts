import { v2, Vector2 } from 'pocket-physics';
import { DPRCanvas, makeDPRCanvas } from './canvas';
import {
  EntityDefSelector,
  MovementCmp,
  SpringConstraintCmp,
  useCES,
} from './components';
import { usePrimaryCanvas, useRootElement } from './dom';
import { assertDefinedFatal } from './utils';

type Pixels = number & { _isPixels: true };

export type ViewportUnits<T = number> = T & { _isViewportUnits: true };
export function asViewportUnits(n: number) {
  return n as ViewportUnits;
}
export type ViewportUnitVector2 = Vector2<ViewportUnits>;

export function vv2(x: number = 0, y: number = 0) {
  return v2(x, y) as ViewportUnitVector2;
}

export type ViewportCmp = {
  k: 'viewport';
  ratio: number;
  width: Pixels;
  height: Pixels;
  vpWidth: ViewportUnits<100>;
  vpHeight: ViewportUnits;
  // shake: AssuredEntityId<MovementCmp>;
  // shakeConstraint: AssuredEntityId<SpringConstraintCmp>;
  dprCanvas: DPRCanvas;
};

export type ViewportDef = [ViewportCmp, SpringConstraintCmp];
export const viewportSelector: EntityDefSelector<ViewportDef> = [
  'viewport',
  'spring-constraint',
] as const;

// TODO: this should probably be a "camera"
// TODO: probably want a "do not shake" property. UI Shaking might be weird.
export const toPixelUnits = (n: ViewportUnits, axis: 'x' | 'y' = 'x') => {
  const ces = useCES();
  const id = ces.selectFirst(viewportSelector);
  const vp = ces.data(id, 'viewport');
  assertDefinedFatal(vp, 'no viewport');

  // Super hack! Assume constraint.v1 is the un-anchored point
  const shakeConstraint = ces.data(id, 'spring-constraint');
  const shake = ces.data(shakeConstraint?.v1, 'v-movement');
  assertDefinedFatal(shake, 'no shake');
  const x = shake.cpos.x;
  const y = shake.cpos.y;
  const withShakeX = (n + x) / vp.vpWidth;
  const withShakeY = (n + y) / vp.vpHeight;
  const cvs = vp.dprCanvas;
  const pixels =
    axis === 'x' ? cvs.width * withShakeX : cvs.height * withShakeY;
  return Math.floor(pixels);
};

export const toViewportUnits = (n: number): ViewportUnits => {
  const ces = useCES();
  const vp = ces.selectFirstData('viewport');
  if (process.env.NODE_ENV !== 'production') {
    if (!vp)
      throw new Error(
        'tried to compute pixel units without a viewport defined!'
      );
  }
  const units = (n / vp!.dprCanvas.width) * 100;
  return units as ViewportUnits;
};

export function drawAsset(
  asset: HTMLImageElement,
  interp: number,
  cpos: Vector2,
  ppos: Vector2,
  width: ViewportUnits,
  height: ViewportUnits = width,
  center = false
) {
  const ces = useCES();
  const vp = ces.selectFirstData('viewport');

  const x = toPixelUnits(
    (ppos.x + interp * (cpos.x - ppos.x)) as ViewportUnits
  );
  const y = toPixelUnits(
    (ppos.y + interp * (cpos.y - ppos.y)) as ViewportUnits
  );

  const pxWidth = toPixelUnits(width);
  const pxHeight = toPixelUnits(height);

  vp!.dprCanvas.ctx.drawImage(
    asset,
    0,
    0,
    asset.width,
    asset.height,
    center ? x - pxWidth / 2 : x,
    center ? y - pxHeight / 2 : y,
    pxWidth,
    pxHeight
  );
}

export function deriveViewportCmp(): ViewportCmp {
  const ratio = 0.6;

  // if the window is taller than wide, use the window width for the width.
  // Otherwise, use the ratio to derive the width from the window height
  const width =
    window.innerWidth < window.innerHeight
      ? window.innerWidth
      : window.innerHeight * ratio;

  // if the window is taller than wide, use the window width to derive the height.
  // Otherwise, use the window height as the height.
  const height =
    window.innerWidth < window.innerHeight
      ? window.innerWidth / ratio
      : window.innerHeight;

  return {
    k: 'viewport',
    ratio,
    width: width as Pixels,
    height: height as Pixels,
    vpWidth: 100 as ViewportUnits<100>,
    vpHeight: (100 / 0.6) as ViewportUnits,
    dprCanvas: makeDPRCanvas(width, height, usePrimaryCanvas()),
  };
}

export function computeWindowResize() {
  const cmp = deriveViewportCmp();
  const ces = useCES();

  {
    // On resize, destroy existing component and depdendent components.
    const existingId = ces.selectFirst(viewportSelector);
    const constraint = ces.data(existingId, 'spring-constraint');
    ces.destroy(constraint?.v1);
    ces.destroy(constraint?.v2);
    ces.destroy(existingId);
  }

  const anchor: MovementCmp = {
    k: 'v-movement',
    cpos: vv2(),
    ppos: vv2(),
    acel: vv2(),
  };

  const shake: MovementCmp = {
    k: 'v-movement',
    cpos: vv2(),
    ppos: vv2(),
    acel: vv2(),
  };

  const anchorId = ces.entity([anchor]);
  const shakeId = ces.entity([shake]);

  const constraint: SpringConstraintCmp = {
    k: 'spring-constraint',
    v1: shakeId,
    v1Mass: 10,
    v2: anchorId,
    v2Mass: 0,
    goal: 0.1,
    stiffness: 0.2,
  };

  const root = useRootElement();
  root.style.width = cmp.width + 'px';

  const def: ViewportDef = [cmp, constraint];
  ces.entity(def);
}

window.addEventListener('resize', computeWindowResize);
