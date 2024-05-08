import { add, copy, scale, v2, Vector2 } from 'pocket-physics';
import { DPRCanvas, makeDPRCanvas } from '../canvas';
import { usePrimaryCanvas, useRootElement } from '../dom';
import { CES3C } from '../initialize-ces';
import { BlackRGBA, BodyTextFont, TitleTextFont, YellowRGBA } from '../theme';

type Pixels = number & { _isPixels: true };
export function asPixels(n: number) {
  return n as Pixels;
}

export type ViewportUnits<T = number> = T & { _isViewportUnits: true };
export function asViewportUnits(n: number) {
  return n as ViewportUnits;
}
export type ViewportUnitVector2 = Vector2<ViewportUnits>;

export function vv2(x: number = 0, y: number = 0) {
  return v2(x, y) as ViewportUnitVector2;
}

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

function toPixelUnitsVec(
  out: Vector2,
  vp: ViewportCmp,
  v: ViewportUnitVector2
) {
  // const ces = useCES();
  // const vp = ces.selectFirstData('viewport')!;
  const cvs = vp.dprCanvas;

  scale(out, v, 1 / vp.vpWidth);
  scale(out, out, cvs.width);

  out.x = Math.floor(out.x);
  out.y = Math.floor(out.y);

  return out as { x: Pixels; y: Pixels };
}

// Ignore the camera's position when computing pixel values (for relative use only)
export function toPixelUnits(vp: ViewportCmp, n: ViewportUnits) {
  const cvs = vp.dprCanvas;

  // This causes jittering...
  // const px = Math.floor((n / vp.vpWidth) * cvs.width);
  const px = (n / vp.vpWidth) * cvs.width;
  return px as Pixels;
}

// Account for the camera position when computing pixel values
export function toProjectedPixels(
  vp: ViewportCmp,
  n: ViewportUnits,
  axis: 'x' | 'y'
) {
  const { camera } = vp;
  return toPixelUnits(
    vp,
    (n - (axis === 'x' ? camera.target.x : camera.target.y)) as ViewportUnits
  );
}

export const toViewportUnits = (vp: ViewportCmp, n: number): ViewportUnits => {
  const units = (n / vp!.dprCanvas.width) * 100;
  return units as ViewportUnits;
};

export function moveViewportCamera(
  vp: ViewportCmp,
  toPos: ViewportUnitVector2
) {
  copy(vp.camera.target, toPos);
}

export function restoreNativeCanvasDrawing(vp: ViewportCmp) {
  const { ctx } = vp.dprCanvas;
  const { camera } = vp;
  ctx.scale(1, -1);
  ctx.translate(
    -toPixelUnits(vp, camera.frustrum.x),
    -toPixelUnits(vp, camera.frustrum.y)
  );
}

export function clearScreen(vp: ViewportCmp) {
  const { ctx } = vp.dprCanvas;
  ctx.save();
  restoreNativeCanvasDrawing(vp);
  ctx.clearRect(0, 0, vp.dprCanvas.cvs.width, vp.dprCanvas.cvs.height);
  ctx.restore();
}

export function fillBeyondCamera(
  vp: ViewportCmp,
  color: BlackRGBA = BlackRGBA
) {
  const { ctx } = vp.dprCanvas;
  ctx.fillStyle = color;

  const remainingX = (vp.camera.frustrum.x * 2) as ViewportUnits;
  const remainingY = (vp.vpHeight - vp.camera.frustrum.y * 2) as ViewportUnits;

  ctx.fillRect(
    toProjectedPixels(
      vp,
      (vp.camera.target.x - vp.camera.frustrum.x) as ViewportUnits,
      'x'
    ),
    toProjectedPixels(
      vp,
      (vp.camera.target.y - vp.camera.frustrum.y) as ViewportUnits,
      'y'
    ),
    toPixelUnits(vp, remainingX),
    toPixelUnits(vp, -remainingY as ViewportUnits)
  );
}

export function drawTextLinesInViewport(
  vp: ViewportCmp,
  text: string,
  start: ViewportUnitVector2,
  alignment: 'center' | 'left' | 'right',
  maxLinesPerCanvas: number,
  color: YellowRGBA | BlackRGBA,
  bgcolor: YellowRGBA | BlackRGBA | 'transparent' = 'transparent',
  fontName: TitleTextFont | BodyTextFont = BodyTextFont
): ViewportUnits {
  const { camera } = vp;

  // translate "relative" viewport position to world coordinates
  const corrected = vv2();
  corrected.x = (camera.target.x - camera.frustrum.x) as ViewportUnits;
  corrected.y = (camera.target.y + camera.frustrum.y) as ViewportUnits;
  add(corrected, corrected, start);

  return drawTextLinesInWorld(
    vp,
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
  vp: ViewportCmp,
  text: string,
  start: ViewportUnitVector2,
  alignment: 'center' | 'left' | 'right',
  maxLinesPerCanvas: number,
  color: YellowRGBA | BlackRGBA,
  bgcolor: YellowRGBA | BlackRGBA | 'transparent' = 'transparent',
  fontName: TitleTextFont | BodyTextFont = BodyTextFont
): ViewportUnits {
  const { camera } = vp;
  const { ctx } = vp.dprCanvas;
  ctx.save();

  // Flip back to +y down to make text correct orientation
  ctx.scale(1, -1);

  const toReverseYProjected = (n: ViewportUnits) =>
    toPixelUnits(vp, (n + camera.target.y) as ViewportUnits);

  const { predictedSingleLineHeight, font } = predictTextHeight(
    vp,
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

    const height: Pixels = toPixelUnits(vp, predictedSingleLineHeight);

    if (i === 0) {
      // fillText draws 0,0 using the baseline, which means 0,0 will be off
      // screen except for descenders. If this is the first line, push down by 1
      // line to make 0,0 on screen.
      y = (y + height) as Pixels;
    }

    const x =
      alignment === 'center'
        ? toProjectedPixels(vp, start.x, 'x') - width / 2
        : alignment === 'left'
        ? toProjectedPixels(vp, start.x, 'x')
        : toProjectedPixels(vp, start.x, 'x') - width;

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

  return toViewportUnits(vp, totalHeight);
}

export function predictTextHeight(
  vp: ViewportCmp,
  text: string,
  maxLinesPerCanvas: number,
  fontName: TitleTextFont | BodyTextFont = BodyTextFont
) {
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
    total: toViewportUnits(vp, heightWithLineHeight * lines.length),
    cssLineHeight: lineHeight,
    predictedSingleLineHeight: toViewportUnits(vp, heightWithLineHeight),
  };
}

export function drawSheetAssetPx(
  vp: ViewportCmp,
  source: HTMLImageElement,
  interp: number,
  cpos: ViewportUnitVector2, // should these be pixels too???
  ppos: ViewportUnitVector2,
  // source: the slice within the sprite sheet atlas
  sourceX: number,
  sourceY: number,
  sourceW: number,
  sourceH: number,
  // the offset of the trimmed slice relative to the original single sprite. aka
  // spriteSourceSize.x/y. If the sprite is not trimmed, these will be zero.
  frameXCorrection: Pixels = asPixels(0),
  frameYCorrection: Pixels = asPixels(0),
  // the size of the original single sprite. If the sprite is not trimmed, these
  // will be the same as the slice size.
  frameWidth: Pixels = asPixels(sourceW),
  frameHeight: Pixels = asPixels(sourceH),

  // whether to center the sprite at cpos/ppos
  center = false,
  scaleX = vp.dprCanvas.dpr,
  scaleY = vp.dprCanvas.dpr
) {
  const { ctx } = vp.dprCanvas;

  const x = toProjectedPixels(
    vp,
    asViewportUnits(ppos.x + interp * (cpos.x - ppos.x)),
    'x'
  );
  const y = toProjectedPixels(
    vp,
    asViewportUnits(ppos.y + interp * (cpos.y - ppos.y)),
    'y'
  );

  const pxCenterWidth = frameWidth * scaleX;
  const pxCenterHeight = frameHeight * scaleY;

  const offsetX = frameXCorrection * scaleX;
  const offsetY = frameYCorrection * scaleY;

  // We are going to flip the coordinate system again to ensure the image is in
  // the correct orientation. Therefore, +y becomes "down" again.
  const destX = (center ? x - pxCenterWidth / 2 : x) + offsetX;
  const destY = (center ? y + pxCenterHeight / 2 : y) - offsetY;

  // TODO: save+restore for every sprite... oof.
  ctx.save();
  ctx.translate(destX, destY);
  ctx.scale(1, -1);
  ctx.drawImage(
    source,
    sourceX,
    sourceY,
    sourceW,
    sourceH,
    0,
    0,
    sourceW * scaleX,
    sourceH * scaleY
  );
  ctx.restore();
}

export function drawSheetAssetVp(
  vp: ViewportCmp,
  source: HTMLImageElement,
  interp: number,
  cpos: ViewportUnitVector2, // should these be pixels too???
  ppos: ViewportUnitVector2,
  // source: the slice within the sprite sheet atlas
  sourceX: number,
  sourceY: number,
  sourceW: number,
  sourceH: number,
  // the offset of the trimmed slice relative to the original single sprite. aka
  // spriteSourceSize.x/y. If the sprite is not trimmed, these will be zero.
  frameXCorrection: Pixels = asPixels(0),
  frameYCorrection: Pixels = asPixels(0),
  // the size of the original single sprite. If the sprite is not trimmed, these
  // will be the same as the slice size.
  frameWidth: Pixels = asPixels(sourceW),
  frameHeight: Pixels = asPixels(sourceH),

  // whether to center the sprite at cpos/ppos
  center = false,

  destWidth: ViewportUnits = asViewportUnits(sourceW),
  destHeight: ViewportUnits = asViewportUnits((sourceH / sourceW) * destWidth)
) {
  const destWidthPx = toPixelUnits(vp, destWidth);
  const destHeightPx = toPixelUnits(vp, destHeight);
  const scaleX = destWidthPx / frameWidth;
  const scaleY = destHeightPx / frameHeight;

  drawSheetAssetPx(
    vp,
    source,
    interp,
    cpos,
    ppos,
    sourceX,
    sourceY,
    sourceW,
    sourceH,
    frameXCorrection,
    frameYCorrection,
    frameWidth,
    frameHeight,
    center,
    scaleX,
    scaleY
  );
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

export function computeWindowResize(ces: CES3C) {
  const cmp = deriveViewportCmp();

  // On resize, destroy existing component and depdendent components.
  const existingId = ces.selectFirst(['viewport']);
  if (existingId) {
    ces.destroy(existingId);
  }

  // TODO: consider hand-rolling a ctx.save/restore that only manages the
  // transform using .getTransform and .setTransform. Lots of perf time taken up
  // by .save/restore() currently.

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

export function initializeResize(ces: CES3C) {
  window.addEventListener('resize', () => computeWindowResize(ces));
}
