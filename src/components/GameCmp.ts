import { Assets } from '../asset-map';
import { CES3C } from '../initialize-ces';
import { Level001 } from '../levels/level-001';
import { UpdateGameTickSystem } from '../systems/UpdateGameTickSystem';
import { assertDefinedFatal } from '../utils';
import { UpdateTimeHz } from '../loopConstants';

// A system of an entity-component-system framework is simply a function that
// is repeatedly called. We separate them into two types based on how often
// they are invoked: every frame or once every update step (10fps by default).
export type DrawStepSystem = (ces: CES3C, interp: number) => void;
export type UpdateStepSystem = (ces: CES3C, dt: number) => void;

type GameState = 'boot' | 'level' | 'died';

export type GameDataCmp = {
  k: 'game-data';
  ticks: number;
  prevState: null | GameState;
  currState: GameState;
  level: number;
  levels: ((ces: CES3C, assets: Assets) => void)[];
  drawStepSystems: DrawStepSystem[];
  updateStepSystems: UpdateStepSystem[];
  gameTickSystem: UpdateStepSystem;
};

export function makeGameCmp(assets: Assets): GameDataCmp {
  return {
    k: 'game-data',
    ticks: 0,
    prevState: null,
    currState: 'boot',
    level: 0,
    levels: [Level001],
    drawStepSystems: [],
    updateStepSystems: [],
    gameTickSystem: UpdateGameTickSystem(assets),
  };
}

export function toGameState(cmp: GameDataCmp, next: GameState) {
  cmp.prevState = cmp.currState;
  cmp.currState = next;
  cmp.ticks = 0;
}

export function getGameTicks(ces: CES3C) {
  const g = ces.selectFirstData('game-data');
  assertDefinedFatal(g);
  return g.ticks;
}

export function gameTicksToMs(ticks: number) {
  return ticks * UpdateTimeHz;
}
