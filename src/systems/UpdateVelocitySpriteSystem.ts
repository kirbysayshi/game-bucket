import { magnitude, sub } from 'pocket-physics';
import { vv2 } from '../components/ViewportCmp';
import { CES3C } from '../initialize-ces';
import { assertDefinedFatal } from '../utils';

// Preallocate
const vel = vv2();

export const UpdateVelocitySpriteSystem = () =>
  function execUpdateVelocitySpriteSystem(ces: CES3C, dt: number) {
    const entities = ces.select([
      'animated-asset',
      'v-movement',
      'multi-frame-velocity-sprite',
    ]);
    for (const e of entities) {
      const asset = ces.data(e, 'animated-asset');
      const mv = ces.data(e, 'v-movement');

      assertDefinedFatal(asset);
      assertDefinedFatal(mv);

      // measure velocity
      sub(vel, mv.cpos, mv.ppos);
      const speed = magnitude(vel);

      // TODO: may need a configurable speed threshold?

      if (speed > 0.001) {
        // if (ces.has(e, 'player-abilities')) {
        //   console.log(speed);
        // }

        asset.animSprite.tick(dt);
      }
    }
  };
