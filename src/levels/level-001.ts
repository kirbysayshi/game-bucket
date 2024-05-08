import { Assets } from '../asset-map';
import { makeEnemy } from '../blueprints/enemy';
import { makePlayer } from '../blueprints/player';
import { asViewportUnits, vv2 } from '../components/ViewportCmp';
import { CES3C } from '../initialize-ces';
import { getRandom } from '../rng';

export function Level001(ces: CES3C, assets: Assets) {
  makePlayer(ces, vv2(50, 50));
  // makeDefenseGoal(ces, vv2(25, 25), vv2(4, 4));
  // makeEnemy(ces, assets, vv2(60, 98), 100, 2);
  // makeEnemy(ces, assets, vv2(64, 98), 100, 1, 0.02);
  // makeEnemy(ces, assets, vv2(68, 98), 100, 1, 0.02);
  // makeEnemy(ces, assets, vv2(72, 98), 100, 1, 0.02);
  // makeEnemy(ces, assets, vv2(76, 98), 100, 1, 0.02);
  // makeEnemy(ces, assets, vv2(82, 98), 100, 1, 0.02);

  const playerBuffer = asViewportUnits(25);

  for (let i = 0; i < 3000; i++) {
    const x = getRandom() * 100;
    const y = getRandom() * 100;

    // Create an initial empty zone around the player by not spawning within the
    // radius.
    const playerDist = Math.sqrt(Math.pow(x - 50, 2) + Math.pow(y - 50, 2));
    if (playerDist < playerBuffer) continue;

    const minAttack = 1;
    const maxAttack = 5;
    const attack = minAttack + Math.floor(getRandom() * maxAttack);

    const minSpeed = 0.01;
    const maxSpeed = 0.1;
    const rand = getRandom();
    const speed = minSpeed + rand * (maxSpeed - minSpeed);

    const minAggro = 0.1;
    const maxAggro = 0.3;
    const aggro = minSpeed + getRandom() * (maxAggro - minAggro);

    makeEnemy(ces, assets, vv2(x, y), 100, attack, speed, aggro);
  }
}
