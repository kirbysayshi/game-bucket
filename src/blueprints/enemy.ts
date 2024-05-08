import { scale } from 'pocket-physics';
import { animations, Assets } from '../asset-map';
import { EntityId } from '../ces3';
import { makeAnimatedAssetCmp } from '../components/AnimatedAssetCmp';
import { incHealth, makeHealthCmp } from '../components/HealthCmp';
import { makeMovementCmp } from '../components/MovementCmp';
import { ViewportUnitVector2, vv2 } from '../components/ViewportCmp';
import { CES3C } from '../initialize-ces';
import { getRandom } from '../rng';
import { assertDefinedFatal } from '../utils';
import { makeSingleFrameSprite } from './single-frame-sprite';

export function makeEnemy(
  ces: CES3C,
  assets: Assets,
  pos: ViewportUnitVector2,
  health = 100,
  attack = 1,
  speed = 0.1,
  aggressiveness = 0.6
) {
  ces.entity([
    makeMovementCmp(pos),
    { k: 'bounding-box', wh: vv2(1, 1) },
    { k: 'debug-drawable-rect' },
    makeAnimatedAssetCmp('enemy-16x16#walk', vv2(4, 4)),
    { k: 'multi-frame-velocity-sprite' },
    { k: 'enemy-miasma', speed, attack, aggressiveness },
    makeHealthCmp(health, (eid) => {
      makeEnemyTombstone(ces, eid, attack);
      ces.destroy(eid);
    }),
    { k: 'drag-phys', drag: 0.5 },
    { k: 'collision-group-001' },
  ]);
}

function makeEnemyTombstone(
  ces: CES3C,
  eid: EntityId,
  playerHealthRegen: number
) {
  // Generate a tombstone (plant) on death
  const currentPos = ces.has(eid, 'v-movement');
  const bb = ces.has(eid, 'bounding-box');
  if (currentPos && bb) {
    const assetChoices = Object.keys(animations).filter((k) =>
      k.match(/plants-/)
    ) as (keyof typeof animations)[];
    const rand = getRandom();
    const idx = Math.floor(assetChoices.length * rand);
    const name = assetChoices[idx];

    makeSingleFrameSprite(ces, currentPos.cpos, scale(bb.wh, bb.wh, 4), name);

    const players = ces.select(['player-abilities', 'health-value']);
    for (const pid of players) {
      const health = ces.data(pid, 'health-value');
      assertDefinedFatal(health);

      // This is a hack to do it in the enemy logic, but otherwise would
      // require a separate system... Give the player back health equal to
      // the enemy's attack.
      incHealth(health, playerHealthRegen);
    }
  }
}