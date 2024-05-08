import {
  add,
  createAABBOverlapResult,
  distance2,
  normalize,
  overlapAABBAABB,
  scale,
  sub,
} from 'pocket-physics';
import { AssuredEntityId } from '../ces3';
import { BoundingBoxCmp } from '../components/BoundingBoxCmp';
import { EnemyMiasmaCmp } from '../components/EnemyMiasmaCmp';
import { decHealth } from '../components/HealthCmp';
import { MovementCmp } from '../components/MovementCmp';
import { EnemyTargetableCmp } from '../components/Tags';
import { ViewportUnits, vv2 } from '../components/ViewportCmp';
import { CES3C } from '../initialize-ces';
import { getRandom } from '../rng';
import { assertDefinedFatal } from '../utils';

// BEGIN: Preallocate to avoid needing potentially hundreds of these per tick.
const dir = vv2();
const enemyAcel = vv2();
const closest: {
  id: AssuredEntityId<MovementCmp | EnemyTargetableCmp | BoundingBoxCmp> | null;
  dist: number | null;
} = {
  id: null,
  dist: null,
};
const aabbOverlapResult = createAABBOverlapResult<ViewportUnits>();
// END: Preallocate

// These are separate functions to aid in profiling.

function queryEnemies(ces: CES3C) {
  return ces.select(['v-movement', 'enemy-miasma', 'bounding-box']);
}

function queryTargets(ces: CES3C) {
  return ces.select(['v-movement', 'enemy-targetable', 'bounding-box']);
}

function queryObstacles(ces: CES3C) {
  return ces.select([
    'v-movement',
    'enemy-impedance',
    'impedance-value',
    'bounding-box',
    'health-value',
  ]);
}

export const UpdateEnemyMiasmaSystem = () =>
  function execEnemyMiasmaSystem(ces: CES3C, dt: number) {
    const entities = queryEnemies(ces);
    const targets = queryTargets(ces);
    const obstacles = queryObstacles(ces);

    for (const e of entities) {
      const emv = ces.data(e, 'v-movement');
      const ebb = ces.data(e, 'bounding-box');
      const emm = ces.data(e, 'enemy-miasma');
      assertDefinedFatal(emv);
      assertDefinedFatal(ebb);
      assertDefinedFatal(emm);

      // if enemy is colliding with an obstacle, apply impedance (0-1)!
      let impedance = 0;

      for (const oid of obstacles) {
        const omv = ces.data(oid, 'v-movement');
        const obb = ces.data(oid, 'bounding-box');
        const oim = ces.data(oid, 'impedance-value');
        const ohh = ces.data(oid, 'health-value');
        assertDefinedFatal(omv);
        assertDefinedFatal(obb);
        assertDefinedFatal(oim);
        assertDefinedFatal(ohh);

        const isOverlapping = overlapAABBAABB(
          emv.cpos.x,
          emv.cpos.y,
          ebb.wh.x,
          ebb.wh.y,
          omv.cpos.x,
          omv.cpos.y,
          obb.wh.x,
          obb.wh.y,
          aabbOverlapResult
        );

        if (isOverlapping) {
          // Use the "last" value only
          impedance = oim.value;

          // Decrement health of the obstacle, they are fragile :)
          decHealth(ohh, emm.attack);
        }
      }

      moveEnemyTowardsTargets(ces, targets, emv, ebb, emm, impedance);
    }
  };

function moveEnemyTowardsTargets(
  ces: CES3C,
  targets: Set<
    AssuredEntityId<MovementCmp | EnemyTargetableCmp | BoundingBoxCmp>
  >,
  emv: MovementCmp,
  ebb: BoundingBoxCmp,
  emm: EnemyMiasmaCmp,
  impedance: number
) {
  closest.dist = closest.id = null;

  for (const t of targets) {
    const tmv = ces.data(t, 'v-movement');
    const tbb = ces.data(t, 'bounding-box');
    const thv = ces.has(t, 'health-value');
    assertDefinedFatal(tmv);
    assertDefinedFatal(tbb);
    const dist = distance2(tmv.cpos, emv.cpos);
    if (closest.dist === null || dist < closest.dist) {
      closest.id = t;
      closest.dist = dist;
    }

    const isOverlapping = overlapAABBAABB(
      emv.cpos.x,
      emv.cpos.y,
      ebb.wh.x,
      ebb.wh.y,
      tmv.cpos.x,
      tmv.cpos.y,
      tbb.wh.x,
      tbb.wh.y,
      aabbOverlapResult
    );

    if (isOverlapping && thv) {
      decHealth(thv, emm.attack);
    }
  }

  if (!closest.id) return;

  const mv = ces.data(closest.id, 'v-movement');
  assertDefinedFatal(mv);

  // Only apply movement based on aggressivness
  const aggroRand = getRandom();
  if (aggroRand < emm.aggressiveness) {
    // find angle to target
    // make accel vector
    // scale based on "agility"
    // add to acel

    sub(dir, mv.cpos, emv.cpos);
    normalize(dir, dir);

    // Move enemy
    const enemySpeed = emm.speed * (1 - impedance);
    scale(enemyAcel, dir, enemySpeed);
    add(emv.acel, emv.acel, enemyAcel);
  }
}