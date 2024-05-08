import { AssuredEntityId } from '../ces3';

export type HealthCmp = {
  k: 'health-value';
  // How much health remains
  value: number;
  max: number;
  // how long in dt since the health changed
  lastChangeMs: Ms;
  onHealthZero?: (eid: AssuredEntityId<HealthCmp>) => void;
};

export function makeHealthCmp(
  max: number,
  onHealthZero?: HealthCmp['onHealthZero'],
  value = max
): HealthCmp {
  return {
    k: 'health-value',
    max,
    value,
    lastChangeMs: -999999, // negative implies just initialized
    onHealthZero,
  };
}

export function decHealth(cmp: HealthCmp, amount: number) {
  cmp.value = Math.max(cmp.value - amount, 0);
  cmp.lastChangeMs = 0;
}

export function incHealth(cmp: HealthCmp, amount: number) {
  cmp.value = Math.min(cmp.value + amount, cmp.max);
  cmp.lastChangeMs = 0;
}
