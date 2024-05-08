import { set } from 'pocket-physics';
import { gameTicksToMs, getGameTicks } from '../components/GameCmp';
import { drawTextLinesInWorld, vv2 } from '../components/ViewportCmp';
import { CES3C } from '../initialize-ces';
import { BodyTextLines, YellowRGBA } from '../theme';
import { assertDefinedFatal } from '../utils';

const dest = vv2();

export const DrawHealthValueSystem = () =>
  function execDrawHealthValueSystem(ces: CES3C, interp: number) {
    const ticks = getGameTicks(ces);
    const vp = ces.selectFirstData('viewport');
    assertDefinedFatal(vp);

    const entities = ces.select(['v-movement', 'health-value', 'bounding-box']);

    for (const eid of entities) {
      const mv = ces.data(eid, 'v-movement');
      const hh = ces.data(eid, 'health-value');
      const bb = ces.data(eid, 'bounding-box');
      assertDefinedFatal(mv);
      assertDefinedFatal(hh);
      assertDefinedFatal(bb);

      const remainMs = 2000;
      const gameMs = gameTicksToMs(ticks);

      // Only show health _after_ the first X ms have passed to avoid rendering
      // all health values on level start. Treat negative values as "never
      // modified beyond initialization"
      if (
        hh.lastChangeMs > remainMs ||
        gameMs <= remainMs ||
        hh.lastChangeMs < 0
      )
        continue;

      set(dest, mv.cpos.x, mv.cpos.y - bb.wh.y / 2);

      drawTextLinesInWorld(
        vp,
        hh.value + '',
        dest,
        'center',
        BodyTextLines,
        YellowRGBA
      );
    }
  };
