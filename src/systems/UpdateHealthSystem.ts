import { CES3C } from '../initialize-ces';
import { assertDefinedFatal } from '../utils';

export const UpdateHealthSystem = () => (ces: CES3C, dt: number) => {
  const entities = ces.select(['health-value']);
  for (const e of entities) {
    const cmp = ces.data(e, 'health-value');
    assertDefinedFatal(cmp);
    cmp.lastChangeMs += dt;
    if (cmp.value <= 0) {
      if (cmp.onHealthZero) {
        cmp.onHealthZero(e);
      } else {
        ces.destroy(e);
      }
    }
  }
};
