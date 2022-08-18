import { copy } from 'pocket-physics';
import { AssuredEntityId } from './ces3';
import { Component, EntityDefSelector, MovementCmp } from './components';
import { listen, useRootElement } from './dom';
import { useCES } from './use-ces';
import { assertDefinedFatal } from './utils';
import { toViewportUnits, ViewportUnitVector2, vv2 } from './viewport';

// https://developer.mozilla.org/en-US/docs/Web/API/Touch_events/Using_Touch_Events
// https://developers.google.com/web/fundamentals/design-and-ux/input/touch/#implement-custom-gestures
// https://github.com/RByers/rbyers.github.io/blob/master/paint.js

export type Box = {
  center: ViewportUnitVector2;
  half: ViewportUnitVector2;
};

export function pointInBox(point: ViewportUnitVector2, box: Box): boolean {
  return (
    point.x > box.center.x - box.half.x &&
    point.x < box.center.x + box.half.x &&
    point.y > box.center.y - box.half.y &&
    point.y < box.center.y + box.half.y
  );
}

export type PointerTargetCmp = {
  k: 'pointer-target';
  box: Box;
};

export type DragStateCmp = {
  k: 'drag-state';
  target: AssuredEntityId<PointerTargetCmp> | null;
};

type DragStateDef = [DragStateCmp, MovementCmp];
export const dragStateSelector: EntityDefSelector<DragStateDef> = [
  'drag-state',
  'v-movement',
] as const;

const pointFromEvent = (ev: TouchEvent | MouseEvent): ViewportUnitVector2 => {
  const asTouch = ev as TouchEvent;
  const asMouse = ev as MouseEvent;

  if (asTouch.targetTouches) {
    return vv2(
      toViewportUnits(asTouch.targetTouches[0].clientX),
      toViewportUnits(asTouch.targetTouches[0].clientY)
    );
  } else {
    return vv2(
      toViewportUnits(asMouse.clientX),
      toViewportUnits(asMouse.clientY)
    );
  }
};

// TODO: enable plain mouse events too! Remember that mousemove events only
// fire if the mouse is still over the element.

function excludeDestroyed<T extends Component>(ids: AssuredEntityId<T>[]) {
  const ces = useCES();
  return ids.filter((id) => !ces.isDestroyed(id));
}

// Without exporting and calling, Rollup was excluding these listeners!
// Proably a better pattern to enclose side-effects into an init function
// anyway but very unintuitive.
export function initDragListeners() {
  const root = useRootElement();
  listen(root, 'touchstart', (ev) => {
    let point = pointFromEvent(ev);
    const ces = useCES();

    // search: did we hit something touchable?
    const targets = ces.select(['pointer-target']);
    let found: null | AssuredEntityId<PointerTargetCmp> = null;
    let foundCenter: null | ViewportUnitVector2 = null;
    targets.forEach((id) => {
      if (found) return;
      const data = ces.data(id, 'pointer-target');
      if (data && pointInBox(point, data.box)) {
        found = id;
        foundCenter = data.box.center;
      }
    });

    if (!found || !foundCenter) return;
    ev.preventDefault();

    // found a target, create a drag state for it!

    const e: DragStateDef = [
      {
        k: 'drag-state',
        target: found,
      },
      {
        k: 'v-movement',
        // Use the found center so the drag target "snaps" to the touch position
        cpos: copy(vv2(), foundCenter),
        ppos: copy(vv2(), foundCenter),
        // cpos: copy(v2(), point),
        // ppos: copy(v2(), point),
        acel: vv2(),
      },
    ];

    ces.entity(e);
  });

  listen(root, 'touchmove', (ev) => {
    const ces = useCES();
    const ids = excludeDestroyed(ces.select(dragStateSelector));
    if (ids.length === 0) return;
    ev.preventDefault();
    // update the drag state with the event position
    const point = pointFromEvent(ev);
    const pos = ces.data(ids[0], 'v-movement');
    assertDefinedFatal(pos);
    // copying the current position to previous will create velocity!
    // we don't want that, since this is now a tracked physics object.
    // copy(pos.ppos, pos.cpos);
    // copy(pos.cpos, point);
    copy(pos.cpos, point);
    copy(pos.ppos, point);
  });

  listen(root, 'touchend', (ev) => {
    const ces = useCES();
    const ids = excludeDestroyed(ces.select(dragStateSelector));
    if (ids.length === 0) return;
    ev.preventDefault();
    const data = ces.data(ids[0], 'drag-state');
    assertDefinedFatal(data);
    data.target = null;
    ces.destroy(ids[0]);
  });
}
