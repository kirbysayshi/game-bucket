import { asViewportUnits } from '../components/ViewportCmp';
import {
  debugDrawIntegratable,
  debugDrawIntegratableRect,
} from '../draw-utils';
import { CES3C } from '../initialize-ces';
import { useDebugMode } from '../query-string';
import { assertDefinedFatal } from '../utils';

export const DrawDebugShapesSystem = () => (ces: CES3C, interp: number) => {
  if (!useDebugMode()) return;

  const vp = ces.selectFirstData('viewport');

  const ecircles = ces.select([
    'v-movement',
    'bounding-box',
    'debug-drawable-circle',
  ]);
  const erects = ces.select([
    'v-movement',
    'bounding-box',
    'debug-drawable-rect',
  ]);

  assertDefinedFatal(vp);

  for (const e of ecircles) {
    const bb = ces.data(e, 'bounding-box');
    const mv = ces.data(e, 'v-movement');
    // synchronous selection and execution means no chance of deletion after selection
    assertDefinedFatal(bb);
    assertDefinedFatal(mv);
    debugDrawIntegratable(
      vp,
      vp.dprCanvas.ctx,
      mv,
      interp,
      asViewportUnits((bb.wh.x > bb.wh.y ? bb.wh.y : bb.wh.x) / 2)
    );
  }

  for (const e of erects) {
    const bb = ces.data(e, 'bounding-box');
    const mv = ces.data(e, 'v-movement');
    // synchronous selection and execution means no chance of deletion after selection
    assertDefinedFatal(bb);
    assertDefinedFatal(mv);
    debugDrawIntegratableRect(vp, vp.dprCanvas.ctx, mv, interp, bb.wh);
  }
};
