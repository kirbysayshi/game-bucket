import {
  add,
  collisionResponseAABB,
  createAABBOverlapResult,
  overlapAABBAABB,
  scale,
  sub,
} from 'pocket-physics';
import {
  AssuredEntityId,
  dangerouslySpecifyAsssuredEntityId,
  EntityId,
} from '../ces3';
import { BoundingBoxCmp } from '../components/BoundingBoxCmp';
import { MovementCmp } from '../components/MovementCmp';
import {
  asViewportUnits,
  ViewportUnitVector2,
  vv2,
} from '../components/ViewportCmp';
import { CES3C } from '../initialize-ces';
import { SpatialHandleExt, SpatialHash } from '../spatial-hash';
import { assertDefinedFatal } from '../utils';

const collision = createAABBOverlapResult();

export const UpdateSolveOverlapsSystem = (
  group: 'collision-group-001' | 'collision-group-002' = 'collision-group-001'
) =>
  function execSolveOverlapsSystem(ces: CES3C, dt: number) {
    const entities = ces.select(['v-movement', 'bounding-box', group]);

    const hg = new SpatialHash<
      AssuredEntityId<MovementCmp | BoundingBoxCmp>,
      ViewportUnitVector2
    >(asViewportUnits(10));
    for (const e0 of entities) {
      const mv0 = ces.data(e0, 'v-movement');
      const bb0 = ces.data(e0, 'bounding-box');
      assertDefinedFatal(mv0);
      assertDefinedFatal(bb0);

      const hhh = ces.has(e0, 'spatial-grid-handle');

      if (!hhh) {
        const h = hg.add(
          mv0.cpos,
          bb0.wh,
          dangerouslySpecifyAsssuredEntityId<MovementCmp | BoundingBoxCmp>(e0)
        );
        ces.add(e0, { k: 'spatial-grid-handle', handle: h });
      } else {
        hg.update(mv0.cpos, bb0.wh, hhh.handle);
      }
    }

    const pairsThisTick = new Set<HandledPairId>();
    const resolvedThisTick = new Set<HandledPairId>();
    const singlesThisTick = new Set<EntityId['id']>();

    // TODO: it's probably faster to query grid areas?

    for (const e0 of entities) {
      const mv0 = ces.data(e0, 'v-movement');
      const bb0 = ces.data(e0, 'bounding-box');
      assertDefinedFatal(mv0);
      assertDefinedFatal(bb0);

      const results = hg.query(mv0.cpos, bb0.wh);

      solvePairWiseOverlaps(
        ces,
        results,
        false,
        pairsThisTick,
        resolvedThisTick
      );
    }
  };

type HandledPairId = `${EntityId['id']}_${EntityId['id']}`;

function solvePairWiseOverlaps(
  ces: CES3C,
  handles: SpatialHandleExt<AssuredEntityId<MovementCmp | BoundingBoxCmp>>[],
  includeCollisionResponse: boolean = false,

  pairsThisTick = new Set<HandledPairId>(),
  // if two groups are used, this will be needed. if only one group is used for
  // inner collisions, then it is not, due to the loop structure.
  resolvedThisTick = new Set<HandledPairId>()
  // singlesThisTick = new Set<EntityId['id']>()
) {
  for (let i = 0; i < handles.length; i++) {
    const e0 = handles[i].item;

    // singlesThisTick.add(e0.id);

    for (let j = i + 1; j < handles.length; j++) {
      const e1 = handles[j].item;

      // Do not handle overlaps more than once per tick
      const key0: HandledPairId = `${e0.id}_${e1.id}`;
      const key1: HandledPairId = `${e1.id}_${e0.id}`;

      if (pairsThisTick.has(key0) || pairsThisTick.has(key1)) {
        continue;
      } else {
        pairsThisTick.add(key0);
        pairsThisTick.add(key1);
      }

      const mv0 = ces.data(e0, 'v-movement');
      const bb0 = ces.data(e0, 'bounding-box');
      const pm0 = ces.has(e0, 'p-mass');
      assertDefinedFatal(mv0);
      assertDefinedFatal(bb0);

      const mv1 = ces.data(e1, 'v-movement');
      const bb1 = ces.data(e1, 'bounding-box');
      const pm1 = ces.has(e1, 'p-mass');
      assertDefinedFatal(mv1);
      assertDefinedFatal(bb1);

      // singlesThisTick.add(e1.id);

      const isOverlapping = overlapAABBAABB(
        mv0.cpos.x,
        mv0.cpos.y,
        bb0.wh.x,
        bb0.wh.y,
        mv1.cpos.x,
        mv1.cpos.y,
        bb1.wh.x,
        bb1.wh.y,
        collision
      );

      if (!isOverlapping) continue;

      if (resolvedThisTick.has(key0) || resolvedThisTick.has(key1)) continue;

      resolvedThisTick.add(key0);
      resolvedThisTick.add(key1);

      // move to non-overlapping position
      const overlapHalf = scale(vv2(), collision.resolve, 0.5);
      add(mv1.cpos, mv1.cpos, overlapHalf);
      add(mv1.ppos, mv1.ppos, overlapHalf);
      sub(mv0.cpos, mv0.cpos, overlapHalf);
      sub(mv0.ppos, mv0.ppos, overlapHalf);

      if (!includeCollisionResponse) continue;

      const mv0v = vv2();
      const mv1v = vv2();

      const restitution = 1;
      const staticFriction = 0.9;
      const dynamicFriction = 0.01;

      collisionResponseAABB(
        mv0.cpos,
        mv0.ppos,
        pm0?.mass ?? 1,
        restitution,
        staticFriction,
        dynamicFriction,
        mv1.cpos,
        mv1.ppos,
        pm1?.mass ?? 1,
        restitution,
        staticFriction,
        dynamicFriction,
        // Allow the response function to recompute a normal based on the
        // axis between the centers of the boxes. this produces a more
        // natural looking collision.
        // collision.normal,
        vv2(),
        mv0v,
        mv1v
      );

      // Apply the new velocity
      sub(mv0.ppos, mv0.cpos, mv0v);
      sub(mv1.ppos, mv1.cpos, mv1v);
    }
  }
}
