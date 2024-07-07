import { getRandom } from '../../rng';

export function range(min: number, max: number, rng = getRandom): number {
  return min + rng() * (max - min);
}
