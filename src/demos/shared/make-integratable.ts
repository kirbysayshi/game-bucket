import { Vector2, copy, v2 } from 'pocket-physics';
import { ViewportUnitVector2, vv2 } from '../../components/ViewportCmp';

type ViewportUnitVector2Integratable = {
  cpos: ViewportUnitVector2;
  ppos: ViewportUnitVector2;
  acel: ViewportUnitVector2;
};

export function makeIntegratable(
  initial = vv2(),
): ViewportUnitVector2Integratable {
  return {
    cpos: copy(vv2(), initial),
    ppos: copy(vv2(), initial),
    acel: vv2(),
  };
}
