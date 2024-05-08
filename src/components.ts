import type { AssuredEntityId, NarrowComponent } from './ces3';
import { AnimatedAssetCmp } from './components/AnimatedAssetCmp';
import { AssetCmp } from './components/AssetCmp';
import { BoundingBoxCmp } from './components/BoundingBoxCmp';
import { CooldownCmp } from './components/CooldownCmp';
import { EnemyMiasmaCmp } from './components/EnemyMiasmaCmp';
import { FPSCmp } from './components/FPSCmp';
import { GameDataCmp } from './components/GameCmp';
import { HealthCmp } from './components/HealthCmp';
import { ImpedanceCmp } from './components/ImpedanceCmp';
import { MassCmp } from './components/MassCmp';
import { DragPhysCmp, MovementCmp } from './components/MovementCmp';
import { PlayerAbilitiesCmp } from './components/PlayerAbilitiesCmp';
import { SpatialGridHandleCmp } from './components/SpatialGridHandleCmp';
import { SpringConstraintCmp } from './components/SpringConstraintCmp';
import {
  CollisionGroup001,
  CollisionGroup002,
  DebugDrawableCircleCmp,
  DebugDrawableRectCmp,
  EnemyImpedanceCmp,
  EnemyTargetableCmp,
  MultiFrameVelocitySprite,
  PlacedGrenade,
  SingleFrameSprite,
  UserControlledCmp,
} from './components/Tags';
import { ViewportCmp } from './components/ViewportCmp';

export type Component =
  | FPSCmp
  | AssetCmp
  | SpringConstraintCmp
  | ViewportCmp
  | MovementCmp
  | UserControlledCmp
  | BoundingBoxCmp
  | DebugDrawableCircleCmp
  | DebugDrawableRectCmp
  | EnemyMiasmaCmp
  | EnemyTargetableCmp
  | DragPhysCmp
  | CooldownCmp
  | HealthCmp
  | ImpedanceCmp
  | EnemyImpedanceCmp
  | GameDataCmp
  | CollisionGroup001
  | CollisionGroup002
  | MassCmp
  | PlayerAbilitiesCmp
  | PlacedGrenade
  | SingleFrameSprite
  | MultiFrameVelocitySprite
  | SpatialGridHandleCmp
  | AnimatedAssetCmp;

// NOTE: you don't really need EntityDefSelector and DefToAssuredEntityId. It's
// easier to use AssuredEntityId<...> and keep references to the IDs. Plus the
// borrowing system allows for more complex relationships and lifecycles anyway.
// EntityDefSelector is really only useful for systems to define what they
// require.

// Mapped types are bonkers! The syntax... Without the second
// `extends Component` it would not allow indexing by `"k"`.
export type EntityDefSelector<T extends [Component] | Component[]> = Readonly<{
  [K in keyof T]: T[K] extends Component ? T[K]['k'] : never;
}>;

// Given a list of Components, return a Compatible AssuredEntityId. This allows
// a "Def" (what is passed to EntityDefSelector) to create matching
// AssuredEntityIds.
export type DefToAssuredEntityId<T extends Component[]> = AssuredEntityId<
  NarrowComponent<Component, T[number]['k']>
>;
