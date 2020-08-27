import { CES, AssuredEntityId, NarrowComponent } from "./ces";
import { ViewportCmp, ViewportUnitVector2, ViewportUnits } from "./viewport";
import { PointerTargetCmp, DragStateCmp } from "./drag";
import { useAsset } from "./asset-map";
import { v2 } from "pocket-physics";

export type FPSCmp = {
  k: "fps";
  v: number;
};

export type CircleCmp = {
  k: "circle";
  center: { x: number; y: number };
  radius: number;
};

export type SpringConstraintCmp = {
  k: "spring-constraint";
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
  const data = ces.data(id, "spring-constraint");
  ces.destroy(id);
  ces.destroy(data.v1);
  ces.destroy(data.v2);
}

export type MovementCmp = {
  k: "v-movement";
  // v1: Integratable;
  cpos: ViewportUnitVector2;
  ppos: ViewportUnitVector2;
  acel: ViewportUnitVector2;
};

export type DrawConsoleCmp = {
  k: "draw-console";
};

export type UIEventBindingCmp = {
  k: "ui-bind";
  el: HTMLElement;
  // TODO: this might be a nice lifecycle thing. like this fn gets called, if
  // it exists, when the component itself is destroyed. Would need a different
  // name then. willDestroy?
  destroy: () => void;
};

export type AssetCmp = {
  k: "asset";
  asset: ReturnType<typeof useAsset>;
  width: ViewportUnits;
  height: ViewportUnits;
};

export type DrawableAssetDef = [MovementCmp, AssetCmp];
export const drawableAssetSelector: EntityDefSelector<DrawableAssetDef> = [
  "v-movement",
  "asset"
] as const;

export function drawableAssetDef(
  x: ViewportUnits,
  y: ViewportUnits,
  width: AssetCmp["width"],
  height: AssetCmp["height"],
  asset: AssetCmp["asset"]
): DrawableAssetDef {
  return [
    {
      k: "v-movement",
      cpos: v2(x, y) as ViewportUnitVector2,
      ppos: v2(x, y) as ViewportUnitVector2,
      acel: v2() as ViewportUnitVector2
    },
    {
      k: "asset",
      asset: asset,
      width,
      height
    }
  ];
}

export type Component =
  | FPSCmp
  | AssetCmp
  | DragStateCmp
  | SpringConstraintCmp
  | PointerTargetCmp
  | CircleCmp
  | ViewportCmp
  | UIEventBindingCmp
  | MovementCmp
  | DrawConsoleCmp;

// Mapped types are bonkers! The syntax... Without the second
// `extends Component` it would not allow indexing by `"k"`.
export type EntityDefSelector<T extends [Component] | Component[]> = Readonly<
  { [K in keyof T]: T[K] extends Component ? T[K]["k"] : never }
>;

// Given a list of Components, return a Compatible AssuredEntityId. This allows
// a "Def" (what is passed to EntityDefSelector) to create matching
// AssuredEntityIds.
export type DefToAssuredEntityId<T extends Component[]> = AssuredEntityId<
  NarrowComponent<Component, T[number]["k"]>
>;

// Allow type inference of K to narrow an assured entity. Without this,
// const id: AssuredEntityId<C> = AssuredEntityId<A | B | C> will fail
// const id: AssuredEntityId<C> = narrowAssuredEntity(AssuredEntityId<A | B | C>) is good!
export function narrowAssuredEntity<
  T extends Component,
  K extends AssuredEntityId<T>
>(id: AssuredEntityId<T>) {
  return id as K;
}

export const DrawTimeHz = 60 as const;
export const UpdateTimeHz = 30 as const;

// A system of an entity-component-system framework is simply a function that
// is repeatedly called. We separate them into two types based on how often
// they are invoked: every frame or once every update step (10fps by default).
export type DrawStepSystem = (ces: CES<Component>, interp: number) => void;
export type UpdateStepSystem = (ces: CES<Component>, dt: number) => void;

const ces = new CES<Component>();

export function useCES() {
  return ces;
}
