import { add, angleOf, rotate2d, set, solveDrag } from 'pocket-physics';
import {
  makePlayerPlacedGrenade,
  makePlayerPlacedObstacle,
} from '../blueprints/player-placed-obstacle';
import {
  activateCooldownCmp,
  makeCooldownCmp,
} from '../components/CooldownCmp';
import { vv2 } from '../components/ViewportCmp';
import { CES3C } from '../initialize-ces';
import { getKeyInputs } from '../keys';
import { getUIState } from '../ui';
import { assertDefinedFatal } from '../utils';

export const UpdateInputSystem = () => (ces: CES3C, dt: number) => {
  const entities = ces.select([
    'v-movement',
    'user-controlled',
    'player-abilities',
  ]);
  const keyInputs = getKeyInputs();
  const ui = getUIState();

  let angle = 0;
  if (keyInputs.KeyW && keyInputs.KeyD) angle = Math.PI / 4;
  else if (keyInputs.KeyW && keyInputs.KeyA) angle = Math.PI * (3 / 4);
  else if (keyInputs.KeyS && keyInputs.KeyD) angle = -Math.PI / 4;
  else if (keyInputs.KeyS && keyInputs.KeyA) angle = -Math.PI * (3 / 4);
  else if (keyInputs.KeyW) angle = Math.PI / 2;
  else if (keyInputs.KeyA) angle = Math.PI;
  else if (keyInputs.KeyS) angle = -Math.PI / 2;
  else if (keyInputs.KeyD) angle = 0;

  const origin = vv2();
  const maxAcel = vv2(0.2, 0);
  const drag = 0.5;

  const moveStickIsActive = ui.move.x !== 0 && ui.move.y !== 0;
  const moveStickAngle = angleOf(ui.move);

  if (moveStickIsActive) angle = moveStickAngle;

  const moveAcel = rotate2d(vv2(), maxAcel, origin, angle);

  // TODO: there is a bug where flicking somehow exceeds the max acel
  // Scale movement by stick percent
  if (moveStickIsActive) {
    set(
      moveAcel,
      moveAcel.x * Math.abs(ui.move.x),
      moveAcel.y * Math.abs(ui.move.y)
    );
  }

  const shouldAcceptMove =
    angle !== 0 || (angle === 0 && keyInputs.KeyD) || moveStickIsActive;

  for (const e of entities) {
    const mv = ces.data(e, 'v-movement');
    const pa = ces.data(e, 'player-abilities');
    assertDefinedFatal(mv);
    assertDefinedFatal(pa);
    if (shouldAcceptMove) add(mv.acel, mv.acel, moveAcel);
    solveDrag(mv, drag);

    // TODO: need the cooldown to be attached to an ability component
    if (keyInputs.Digit1) {
      if (!pa.a001.cooldown) {
        pa.a001.cooldown = ces.entity([makeCooldownCmp(100, 0)]);
      }

      const cmp = ces.data(pa.a001.cooldown, 'cooldown');
      assertDefinedFatal(cmp);

      if (cmp.remainingMs === 0) {
        makePlayerPlacedObstacle(ces, mv.cpos, 100, 1);
        activateCooldownCmp(cmp);
      }
    }

    if (keyInputs.Digit2) {
      if (!pa.a002.cooldown) {
        pa.a002.cooldown = ces.entity([makeCooldownCmp(100, 0)]);
      }

      const cmp = ces.data(pa.a002.cooldown, 'cooldown');
      assertDefinedFatal(cmp);

      if (cmp.remainingMs === 0) {
        makePlayerPlacedGrenade(ces, mv.cpos, 10000, 0.8);
        activateCooldownCmp(cmp);
      }
    }
  }
};
