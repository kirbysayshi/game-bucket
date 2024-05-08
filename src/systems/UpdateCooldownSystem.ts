import { CES3C } from '../initialize-ces';
import { assertDefinedFatal } from '../utils';

export const UpdateCooldownSystem = () => (ces: CES3C, dt: number) => {
  const entities = ces.select(['cooldown']);
  for (const e of entities) {
    const cmp = ces.data(e, 'cooldown');
    assertDefinedFatal(cmp);
    const previous = cmp.remainingMs;
    cmp.remainingMs = Math.max(0, cmp.remainingMs - dt);
    // Only fire the notification once, during the frame that zero was reached
    if (previous !== 0 && cmp.remainingMs === 0) cmp.onZeroRemaining(ces, e);
  }
};
