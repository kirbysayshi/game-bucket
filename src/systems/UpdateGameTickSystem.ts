import { Assets } from '../asset-map';
import { toGameState } from '../components/GameCmp';
import { CES3C } from '../initialize-ces';
import { assertDefinedFatal, assertExhaustive } from '../utils';
import { DrawClearScreenSystem } from './DrawClearScreenSystem';
import { DrawDebugCameraSystem } from './DrawDebugCameraSystem';
import { DrawDebugFPSSystem } from './DrawDebugFPSSystem';
import { DrawDebugGridBackgroundSystem } from './DrawDebugGridBackgroundSystem';
import { DrawDebugShapesSystem } from './DrawDebugShapesSystem';
import { DrawHealthValueSystem } from './DrawHealthValueSystem';
import { DrawMultiFrameVelocitySpriteSystem } from './DrawMultiFrameVelocitySpriteSystem';
import { DrawSingleFrameSpriteSystem } from './DrawSingleFrameSpriteSystem';
import { UpdateCooldownSystem } from './UpdateCooldownSystem';
import { UpdateEnemyMiasmaSystem } from './UpdateEnemyMiasmaSystem';
import { UpdateHealthSystem } from './UpdateHealthSystem';
import { UpdateInputSystem } from './UpdateInputSystem';
import { UpdateMovementSystem } from './UpdateMovementSystem';
import { UpdateSolveOverlapsSystem } from './UpdateSolveOverlapsSystem';
import { UpdateVelocitySpriteSystem } from './UpdateVelocitySpriteSystem';

export const UpdateGameTickSystem =
  (assets: Assets) => (ces: CES3C, dt: number) => {
    const g = ces.selectFirstData('game-data');
    assertDefinedFatal(g);

    switch (g.currState) {
      case 'boot': {
        return toGameState(g, 'level');
      }

      case 'level': {
        if (g.ticks === 0) {
          g.updateStepSystems.length = 0;
          g.updateStepSystems.push(
            UpdateCooldownSystem(),
            UpdateInputSystem(),
            UpdateEnemyMiasmaSystem(),
            UpdateMovementSystem(),
            UpdateSolveOverlapsSystem(),
            UpdateHealthSystem(),
            UpdateVelocitySpriteSystem()
          );

          g.drawStepSystems.length = 0;
          g.drawStepSystems.push(
            DrawClearScreenSystem(),
            DrawSingleFrameSpriteSystem(assets),
            DrawMultiFrameVelocitySpriteSystem(assets),
            DrawHealthValueSystem()
          );

          if (process.env.NODE_ENV !== 'production') {
            g.drawStepSystems.push(
              DrawDebugFPSSystem(),
              DrawDebugGridBackgroundSystem(),
              // DrawTestSpriteSystem(assets),
              DrawDebugShapesSystem(),
              DrawDebugCameraSystem()
            );
          }

          const levelInitializer = g.levels[g.level];
          assertDefinedFatal(levelInitializer);
          levelInitializer(ces, assets);
        }

        g.ticks += 1;

        {
          // Test if the player has lost
          const entities = ces.select(['enemy-targetable']);
          const player = ces.select(['user-controlled']);

          if (entities.size === 0 || player.size === 0) {
            return toGameState(g, 'died');
          }
        }

        break;
      }

      case 'died': {
        const result = confirm('You lost! Restart?');
        if (result) {
          // TODO: put a `restart` event into a channel? Or emit 'restart' event handler
          return toGameState(g, 'level');
        }

        break;
      }

      default: {
        assertExhaustive(g.currState);
      }
    }
  };
