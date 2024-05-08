import { AssuredEntityId } from '../ces3';
import { CES3C } from '../initialize-ces';
import { MovementCmp } from './MovementCmp';

export type SpringConstraintCmp = {
  k: 'spring-constraint';
  v1: AssuredEntityId<MovementCmp>;
  v1Mass: number;
  v2: AssuredEntityId<MovementCmp>;
  v2Mass: number;
  goal: number;
  stiffness: number;
};

export function destroySpringConstraint(
  ces: CES3C,
  id: AssuredEntityId<SpringConstraintCmp>
) {
  const data = ces.data(id, 'spring-constraint');
  ces.destroy(id);
  if (!data) return;
  ces.destroy(data.v1);
  ces.destroy(data.v2);
}
