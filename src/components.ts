import { LoadedAsset } from './asset-map';
import { AssuredEntityId, CES3, NarrowComponent } from './ces3';
import { useCES } from './use-ces';
import {
  ViewportCmp,
  ViewportUnits,
  ViewportUnitVector2,
  vv2,
} from './viewport';

export type FPSCmp = {
  k: 'fps';
  v: number;
};

export type CircleCmp = {
  k: 'circle';
  center: { x: number; y: number };
  radius: number;
};

export type SpringConstraintCmp = {
  k: 'spring-constraint';
  v1: AssuredEntityId<MovementCmp>;
  v1Mass: number;
  v2: AssuredEntityId<MovementCmp>;
  v2Mass: number;
  goal: number;
  stiffness: number;
};

export function destroySpringConstraint(
  id: AssuredEntityId<SpringConstraintCmp>
) {
  const ces = useCES();
  const data = ces.data(id, 'spring-constraint');
  ces.destroy(id);
  if (!data) return;
  ces.destroy(data.v1);
  ces.destroy(data.v2);
}

export type MovementCmp = {
  k: 'v-movement';
  // v1: Integratable;
  cpos: ViewportUnitVector2;
  ppos: ViewportUnitVector2;
  acel: ViewportUnitVector2;
};

export type DrawConsoleCmp = {
  k: 'draw-console';
};

export type AssetCmp = {
  k: 'asset';
  asset: LoadedAsset;
  width: ViewportUnits;
  height: ViewportUnits;
};

export type DrawableAssetDef = [MovementCmp, AssetCmp];
export const drawableAssetSelector: EntityDefSelector<DrawableAssetDef> = [
  'v-movement',
  'asset',
] as const;

export function drawableAssetDef(
  x: ViewportUnits,
  y: ViewportUnits,
  width: AssetCmp['width'],
  height: AssetCmp['height'],
  asset: AssetCmp['asset']
): DrawableAssetDef {
  return [
    {
      k: 'v-movement',
      cpos: vv2(x, y),
      ppos: vv2(x, y),
      acel: vv2(),
    },
    {
      k: 'asset',
      asset: asset,
      width,
      height,
    },
  ];
}

export type Component =
  | FPSCmp
  | AssetCmp
  | SpringConstraintCmp
  | CircleCmp
  | ViewportCmp
  | MovementCmp
  | DrawConsoleCmp;

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

export const DrawTimeHz = 60 as const;
export const UpdateTimeHz = 30 as const;

// A system of an entity-component-system framework is simply a function that
// is repeatedly called. We separate them into two types based on how often
// they are invoked: every frame or once every update step (10fps by default).
export type DrawStepSystem = (ces: CES3<Component>, interp: number) => void;
export type UpdateStepSystem = (ces: CES3<Component>, dt: number) => void;
