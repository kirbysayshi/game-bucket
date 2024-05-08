import {
  drawTextLinesInViewport,
  predictTextHeight,
  vv2,
} from '../components/ViewportCmp';
import { CES3C } from '../initialize-ces';
import { useDebugMode } from '../query-string';
import { BodyTextLines, YellowRGBA } from '../theme';
import { assertDefinedFatal } from '../utils';

// Draw the FPS as text on the canvas
export const DrawDebugFPSSystem = () => (ces: CES3C) => {
  if (!useDebugMode()) return;

  const vp = ces.selectFirstData('viewport');
  const fpsData = ces.selectFirstData('fps');
  assertDefinedFatal(vp);
  assertDefinedFatal(fpsData);

  const text = fpsData.v.toFixed(2);
  const h = predictTextHeight(vp, text, BodyTextLines);
  drawTextLinesInViewport(
    vp,
    text,
    vv2(vp.vpWidth, -vp.vpHeight + h.total),
    'right',
    BodyTextLines,
    YellowRGBA
  );
};
