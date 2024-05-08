import { accelerate, inertia, solveDrag } from 'pocket-physics';
import { CES3C } from '../initialize-ces';
import { assertDefinedFatal } from '../utils';

// Physics "system", updated at 10fps
export const UpdateMovementSystem = () => (ces: CES3C, dt: number) => {
  const entities = ces.select(['v-movement']);
  entities.forEach((e) => {
    const cmp = ces.data(e, 'v-movement');
    assertDefinedFatal(cmp);

    const drag = ces.has(e, 'drag-phys');
    if (drag) {
      solveDrag(cmp, drag.drag);
    }

    accelerate(cmp, dt);
    inertia(cmp);
  });
};
