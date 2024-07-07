import { Vector2, copy, v2 } from 'pocket-physics';

export function makeIntegratable(initial: Vector2 = v2()) {
  return {
    cpos: copy(v2(), initial),
    ppos: copy(v2(), initial),
    acel: v2(),
  };
}
