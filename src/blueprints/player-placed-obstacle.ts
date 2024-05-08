import { distance2, normalize, scale, sub } from 'pocket-physics';
import { makeCooldownCmp } from '../components/CooldownCmp';
import { decHealth, makeHealthCmp } from '../components/HealthCmp';
import { makeImpedanceCmp } from '../components/ImpedanceCmp';
import { makeMovementCmp } from '../components/MovementCmp';
import {
  asViewportUnits,
  ViewportUnits,
  ViewportUnitVector2,
  vv2,
} from '../components/ViewportCmp';
import { CES3C } from '../initialize-ces';
import { assertDefinedFatal } from '../utils';

// TODO: better name...
export function makePlayerPlacedObstacle(
  ces: CES3C,
  pos: ViewportUnitVector2,
  health: number,
  impedance: number
) {
  ces.entity([
    makeMovementCmp(pos),
    { k: 'bounding-box', wh: vv2(2, 2) },
    { k: 'debug-drawable-circle' },
    makeHealthCmp(health),
    { k: 'enemy-impedance' },
    makeImpedanceCmp(impedance),
  ]);
}

export function makePlayerPlacedGrenade(
  ces: CES3C,
  pos: ViewportUnitVector2,
  health: number,
  impedance: number
) {
  const wh = vv2(4, 4);

  ces.entity([
    makeMovementCmp(pos),
    { k: 'bounding-box', wh },
    { k: 'debug-drawable-circle' },
    makeHealthCmp(health),
    { k: 'enemy-impedance' },
    makeImpedanceCmp(impedance),
    makeCooldownCmp(3000, 3000, (ces, eid) => {
      // get current position
      const mv = ces.has(eid, 'v-movement');
      assertDefinedFatal(mv);

      // spawn explosion / blast radius
      const splashSize = asViewportUnits(wh.x * 1.3);
      makePusherExplosion(ces, mv.cpos, splashSize, asViewportUnits(20));

      // Destroy yourself and this entire entity
      ces.destroy(eid);
    }),
    { k: 'placed-grenade' },
  ]);
}

function makePusherExplosion(
  ces: CES3C,
  pos: ViewportUnitVector2,
  effectRadius: ViewportUnits,
  strengthImpulse: ViewportUnits,
  attack = 50
) {
  // create the visual effect

  // create the physics effect
  const enemies = ces.select(['v-movement', 'health-value', 'enemy-miasma']);
  const effectRadius2 = effectRadius * effectRadius;

  const reg0 = vv2();

  // TODO: probably should use spatial grid here for initial query.
  for (const eid of enemies) {
    const mv = ces.data(eid, 'v-movement');
    assertDefinedFatal(mv);
    // don't need the real distance since it's just proportional. distance2
    // avoids the sqrt.
    const dist2 = distance2(pos, mv.cpos);
    const ratio = dist2 / effectRadius2;

    // if (process.env.NODE_ENV !== 'production') {
    //   const dist = distance(pos, mv.cpos);
    //   console.log({
    //     eid: eid.id,
    //     dist,
    //     effectRadius,
    //     dist2,
    //     ratio,
    //     effectRadius2,
    //   });
    // }

    if (ratio > 1) continue; // outside effect radius
    const magnitude = (1 - ratio) * strengthImpulse;

    {
      // Apply the impulse directly to velocity in the direction of the
      // explosion (outwards)

      // TODO: may want to use acceleration instead, so it's not instantaneous jump
      const dir = sub(reg0, mv.cpos, pos);
      const norm = normalize(dir, dir);
      const vel = scale(norm, norm, magnitude);
      sub(mv.ppos, mv.cpos, vel);
    }

    // Decrement the enemy health!
    const hv = ces.data(eid, 'health-value');
    assertDefinedFatal(hv);
    decHealth(hv, attack);

    // if (process.env.NODE_ENV !== 'production') {
    //   console.log({ eid: eid.id });
    // }
  }
}
