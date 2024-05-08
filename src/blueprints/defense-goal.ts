import { makeHealthCmp } from '../components/HealthCmp';
import { makeMovementCmp } from '../components/MovementCmp';
import { ViewportUnitVector2 } from '../components/ViewportCmp';
import { CES3C } from '../initialize-ces';

export function makeDefenseGoal(
  ces: CES3C,
  pos: ViewportUnitVector2,
  wh: ViewportUnitVector2
) {
  ces.entity([
    makeMovementCmp(pos),
    { k: 'bounding-box', wh },
    { k: 'debug-drawable-rect' },
    { k: 'enemy-targetable' },
    makeHealthCmp(1000),
  ]);
}
