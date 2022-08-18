import { add, copy, scale, v2, Vector2 } from 'pocket-physics';
import { DPRCanvas, makeDPRCanvas } from './canvas';
import { usePrimaryCanvas, useRootElement } from './dom';
import { BlackRGBA, BodyTextFont, TitleTextFont, YellowRGBA } from './theme';
import { useCES } from './use-ces';

type Pixels = number & { _isPixels: true };

export type ViewportUnits<T = number> = T & { _isViewportUnits: true };
export function asViewportUnits(n: number) {
  return n as ViewportUnits;
}
export type ViewportUnitVector2 = {
  x: ViewportUnits;
  y: ViewportUnits;
};

export function vv2(x: number = 0, y: number = 0) {
  return v2(x, y) as ViewportUnitVector2;
}

export type IntegratableVU = {
  cpos: ViewportUnitVector2;
  ppos: ViewportUnitVector2;
  acel: ViewportUnitVector2;
};

type Camera = {
  // if mode === center, helf width offset from center
  frustrum: ViewportUnitVector2;
  mode: 'center';
  target: ViewportUnitVector2;
};

export type ViewportCmp = {
  k: 'viewport';
  ratio: number;
  width: Pixels;
  height: Pixels;
  vpWidth: ViewportUnits<100>;
  vpHeight: ViewportUnits;
  dprCanvas: DPRCanvas;

  camera: Camera;
};

function toPixelUnitsVec(out: Vector2, v: ViewportUnitVector2) {
  const ces = useCES();
  const vp = ces.selectFirstData('viewport')!;
  const cvs = vp.dprCanvas;

  scale(out, v, 1 / vp.vpWidth);
  scale(out, out, cvs.width);

  out.x = Math.floor(out.x);
  out.y = Math.floor(out.y);

  return out as { x: Pixels; y: Pixels };
}

// Ignore the camera's position when computing pixel values (for relative use only)
export function toPixelUnits(n: ViewportUnits) {
  const ces = useCES();
  const vp = ces.selectFirstData('viewport')!;
  const cvs = vp.dprCanvas;

  // This causes jittering...
  // const px = Math.floor((n / vp.vpWidth) * cvs.width);
  const px = (n / vp.vpWidth) * cvs.width;
  return px as Pixels;
}

// Account for the camera position when computing pixel values
export function toProjectedPixels(n: ViewportUnits, axis: 'x' | 'y') {
  // TODO: perhaps make this a method on camera instead to avoid so many lookups.
  const ces = useCES();
  const vp = ces.selectFirstData('viewport')!;
  const { camera } = vp;
  return toPixelUnits(
    (n - (axis === 'x' ? camera.target.x : camera.target.y)) as ViewportUnits
  );
}

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

export function moveViewportCamera(toPos: ViewportUnitVector2) {
  const ces = useCES();
  const vp = ces.selectFirstData('viewport')!;
  copy(vp.camera.target, toPos);
}

export function restoreNativeCanvasDrawing(vp: ViewportCmp) {
  const { ctx } = vp.dprCanvas;
  const { camera } = vp;
  ctx.scale(1, -1);
  ctx.translate(
    -toPixelUnits(camera.frustrum.x),
    -toPixelUnits(camera.frustrum.y)
  );
}

export function clearScreen() {
  const ces = useCES();
  const vp = ces.selectFirstData('viewport')!;
  const { ctx } = vp.dprCanvas;
  ctx.save();
  restoreNativeCanvasDrawing(vp);
  ctx.clearRect(0, 0, vp.dprCanvas.cvs.width, vp.dprCanvas.cvs.height);
  ctx.restore();
}

export function fillBeyondCamera(color: BlackRGBA = BlackRGBA) {
  const ces = useCES();
  const vp = ces.selectFirstData('viewport')!;
  const { ctx } = vp.dprCanvas;
  ctx.fillStyle = color;

  const remainingX = (vp.camera.frustrum.x * 2) as ViewportUnits;
  const remainingY = (vp.vpHeight - vp.camera.frustrum.y * 2) as ViewportUnits;

  ctx.fillRect(
    toProjectedPixels(
      (vp.camera.target.x - vp.camera.frustrum.x) as ViewportUnits,
      'x'
    ),
    toProjectedPixels(
      (vp.camera.target.y - vp.camera.frustrum.y) as ViewportUnits,
      'y'
    ),
    toPixelUnits(remainingX),
    toPixelUnits(-remainingY as ViewportUnits)
  );
}

export function drawTextLinesInViewport(
  text: string,
  start: ViewportUnitVector2,
  alignment: 'center' | 'left' | 'right',
  maxLinesPerCanvas: number,
  color: YellowRGBA | BlackRGBA,
  bgcolor: YellowRGBA | BlackRGBA | 'transparent' = 'transparent',
  fontName: TitleTextFont | BodyTextFont = BodyTextFont
): ViewportUnits {
  const ces = useCES();
  const vp = ces.selectFirstData('viewport')!;
  const { camera } = vp;

  // translate "relative" viewport position to world coordinates
  const corrected = vv2();
  corrected.x = (camera.target.x - camera.frustrum.x) as ViewportUnits;
  corrected.y = (camera.target.y + camera.frustrum.y) as ViewportUnits;
  add(corrected, corrected, start);

  return drawTextLinesInWorld(
    text,
    corrected,
    alignment,
    maxLinesPerCanvas,
    color,
    bgcolor,
    fontName
  );
}

export function drawTextLinesInWorld(
  text: string,
  start: ViewportUnitVector2,
  alignment: 'center' | 'left' | 'right',
  maxLinesPerCanvas: number,
  color: YellowRGBA | BlackRGBA,
  bgcolor: YellowRGBA | BlackRGBA | 'transparent' = 'transparent',
  fontName: TitleTextFont | BodyTextFont = BodyTextFont
): ViewportUnits {
  const ces = useCES();
  const vp = ces.selectFirstData('viewport')!;
  const { camera } = vp;
  const { ctx } = vp.dprCanvas;
  ctx.save();

  // Flip back to +y down to make text correct orientation
  ctx.scale(1, -1);

  const toReverseYProjected = (n: ViewportUnits) =>
    toPixelUnits((n + camera.target.y) as ViewportUnits);

  const { predictedSingleLineHeight, font } = predictTextHeight(
    text,
    maxLinesPerCanvas,
    fontName
  );

  let totalHeight = 0;
  let y = toReverseYProjected(-start.y as ViewportUnits);

  ctx.font = font;

  text.split('\n').forEach((line, i) => {
    const measure = ctx.measureText(line);
    const width = measure.width + 1;

    const height: Pixels = toPixelUnits(predictedSingleLineHeight);

    if (i === 0) {
      // fillText draws 0,0 using the baseline, which means 0,0 will be off
      // screen except for descenders. If this is the first line, push down by 1
      // line to make 0,0 on screen.
      y = (y + height) as Pixels;
    }

    const x =
      alignment === 'center'
        ? toProjectedPixels(start.x, 'x') - width / 2
        : alignment === 'left'
        ? toProjectedPixels(start.x, 'x')
        : toProjectedPixels(start.x, 'x') - width;

    // TODO: add a padding?
    if (bgcolor !== 'transparent') {
      ctx.fillStyle = bgcolor;
      ctx.fillRect(x, y, width, -height);
    }

    ctx.fillStyle = color;
    ctx.fillText(line, x, y);

    y = (y + height) as Pixels;
    totalHeight += height;
  });

  ctx.restore();

  return toViewportUnits(totalHeight);
}

export function predictTextHeight(
  text: string,
  maxLinesPerCanvas: number,
  fontName: TitleTextFont | BodyTextFont = BodyTextFont
) {
  const ces = useCES();
  const vp = ces.selectFirstData('viewport')!;
  const { ctx } = vp.dprCanvas;
  const textSize = vp.height / maxLinesPerCanvas;

  ctx.save();

  // This will need to be manually adjusted depending on the font.
  const lineHeight = 1.2;
  const font = `${textSize}px/${lineHeight} ${fontName}`;
  ctx.font = font;

  const lineMeasurements = ctx.measureText(text);

  // These bounding boxes are just... flat out wrong. they're off by at least 1
  // or 2 pixels depending on the font. It's better than using the raw fontSize,
  // but still wrong!
  const measuredHeight = lineMeasurements.actualBoundingBoxAscent
    ? ((lineMeasurements.actualBoundingBoxAscent +
        lineMeasurements.actualBoundingBoxDescent) as Pixels)
    : (textSize as Pixels);

  const heightWithLineHeight = (measuredHeight * lineHeight) as Pixels;

  ctx.restore();

  const lines = text.split('\n');
  return {
    font,
    fontSize: `${textSize}px`,
    total: toViewportUnits(heightWithLineHeight * lines.length),
    cssLineHeight: lineHeight,
    predictedSingleLineHeight: toViewportUnits(heightWithLineHeight),
  };
}

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
  const vp = ces.selectFirstData('viewport')!;
  const { ctx } = vp.dprCanvas;

  const x = toProjectedPixels(
    asViewportUnits(ppos.x + interp * (cpos.x - ppos.x)),
    'x'
  );
  const y = toProjectedPixels(
    asViewportUnits(ppos.y + interp * (cpos.y - ppos.y)),
    'y'
  );

  const pxWidth = toPixelUnits(width);
  const pxHeight = toPixelUnits(height);

  ctx.save();
  ctx.scale(1, -1);

  ctx.drawImage(
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
  ctx.restore();
}

export function deriveViewportCmp(frustrum = vv2(50, 50)): ViewportCmp {
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

  const dprCanvas = makeDPRCanvas(width, height, usePrimaryCanvas());
  const camera = {
    frustrum,
    mode: 'center' as const,
    target: vv2(0, 0),
  };

  return {
    k: 'viewport',
    ratio,
    width: width as Pixels,
    height: height as Pixels,
    vpWidth: 100 as ViewportUnits<100>,
    vpHeight: (100 / 0.6) as ViewportUnits,
    dprCanvas,
    camera,
  };
}

export function computeWindowResize() {
  const cmp = deriveViewportCmp();
  const ces = useCES();

  // On resize, destroy existing component and depdendent components.
  const existingId = ces.selectFirst(['viewport']);
  if (existingId) {
    ces.destroy(existingId);
  }

  const root = useRootElement();
  root.style.width = cmp.width + 'px';

  const toPx = (n: number) =>
    Math.floor((n / cmp.vpWidth) * cmp.dprCanvas.width);
  cmp.dprCanvas.ctx.translate(
    toPx(cmp.camera.frustrum.x),
    toPx(cmp.camera.frustrum.y)
  );
  // Force +y to be UP. Remember to reverse when writing text or image!
  // https://usefulangle.com/post/18/javascript-html5-canvas-solving-problem-of-inverted-text-when-y-axis-flipped
  cmp.dprCanvas.ctx.scale(1, -1);

  const def = [cmp];
  ces.entity(def);
}

window.addEventListener('resize', computeWindowResize);
