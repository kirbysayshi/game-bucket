import type { AssuredEntityId } from '../ces3';
import type { SpatialHandleExt } from '../spatial-hash';
import type { BoundingBoxCmp } from './BoundingBoxCmp';
import type { MovementCmp } from './MovementCmp';

export type SpatialGridHandleCmp = {
  k: 'spatial-grid-handle';
  handle: SpatialHandleExt<AssuredEntityId<MovementCmp | BoundingBoxCmp>>;
};
