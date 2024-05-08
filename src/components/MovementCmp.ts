import { copy } from 'pocket-physics';
import { ViewportUnitVector2, vv2 } from './ViewportCmp';

export type MovementCmp = {
  k: 'v-movement';
  // v1: Integratable;
  cpos: ViewportUnitVector2;
  ppos: ViewportUnitVector2;
  acel: ViewportUnitVector2;
};

export type DragPhysCmp = {
  k: 'drag-phys';
  drag: number;
};

export function makeMovementCmp(pos: ViewportUnitVector2): MovementCmp {
  return {
    k: 'v-movement',
    cpos: copy(vv2(), pos),
    ppos: copy(vv2(), pos),
    acel: vv2(),
  };
}
