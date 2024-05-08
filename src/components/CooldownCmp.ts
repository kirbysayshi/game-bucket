import { AssuredEntityId } from '../ces3';
import { CES3C } from '../initialize-ces';

export type CooldownCmp = {
  k: 'cooldown';
  // How much time remains
  remainingMs: number;
  // What the max time is when initializing or resetting
  durationMs: number;

  onZeroRemaining: (ces: CES3C, eid: AssuredEntityId<CooldownCmp>) => void;
};

const noop = () => void 0;

export function makeCooldownCmp(
  durationMs: number,
  remainingMs = durationMs,
  // Aka "when the cooldown is complete"
  onZeroRemaining: CooldownCmp['onZeroRemaining'] = noop
): CooldownCmp {
  return {
    k: 'cooldown',
    durationMs,
    remainingMs,
    onZeroRemaining,
  };
}

/**
 * Mark the resource attached to this cooldown as "used", meaning remainingMs
 * has a non-zero value.
 */
export function activateCooldownCmp(cmp: CooldownCmp) {
  cmp.remainingMs = cmp.durationMs;
}
