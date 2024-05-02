// The primary key into the component data. If `destroyed`, then this key is

import { Vector2 } from 'pocket-physics';

// considered dead and components cannot be added or removed.
export type EntityId = { id: number; owned: boolean; destroyed: boolean };

function entityIdIndex(eid: EntityId) {
  return eid.id & ENTITY_INDEX_MASK;
}

function entityIdGeneration(eid: EntityId) {
  return (eid.id >> ENTITY_INDEX_BITS) & ENTITY_GENERATION_MASK;
}

function makeEntity(idx: number, generation: number): EntityId {
  return {
    id: (idx << ENTITY_GENERATION_BITS) | generation,
    owned: true,
    destroyed: false,
  };
}

function xassert(value: boolean, debug: unknown) {
  if (!value) throw new Error(`expected true, got false: ${debug}`);
}

// interface ComponentManager<T> {
//   get(id: EntityId): T | undefined;
// }

const ENTITY_INDEX_BITS = 22;
const ENTITY_INDEX_MASK = (1 << ENTITY_INDEX_BITS) - 1;
const ENTITY_GENERATION_BITS = 8;
const ENTITY_GENERATION_MASK = (1 << ENTITY_GENERATION_BITS) - 1;

export class EntityManager {
  private generation: number[] = [];
  private freeIndices: number[] = [];
  public MINIMUM_FREE_INDICES = 1024;

  create() {
    let idx;
    if (this.freeIndices.length > this.MINIMUM_FREE_INDICES) {
      idx = this.freeIndices.shift();
    }

    if (!idx) {
      this.generation.push(0);
      // idx = this.generation.length - 1;
      idx = this.generation.length;
      xassert(idx < 1 << ENTITY_INDEX_BITS, idx);
    }

    return makeEntity(idx, this.generation[idx]);
  }

  destroy(eid: EntityId) {
    const idx = entityIdIndex(eid);
    ++this.generation[idx];
    this.freeIndices.push(idx);
  }
}

type ComponentManagerHandle = {
  idx: number;
};

export function lookup<T extends ComponentData>(
  man: ComponentManager<T>,
  eid: EntityId,
) {
  const idx = man.map.get(eid);
  return idx ? { idx } : null;
}

export function addComponent<T extends ComponentData>(
  man: ComponentManager<T>,
  eid: EntityId,
  init: {
    [K in keyof T]: T[K][number];
  },
) {
  const idx = man.entities.length || 1;
  for (let key of Object.keys(init) as (keyof typeof init)[]) {
    man.data[key][idx] = init[key];
  }
  man.entities[idx] = eid;

  // Allow multiple instances of the component per ID!
  const existing = man.map.get(eid);
  if (!existing) {
    // This is the first
    man.map.set(eid, idx);
    return true;
  } else {
    // This is not the first
    console.log('not first', eid, existing);
    const nexts = man.nextData[existing] ?? { indices: [] };
    nexts.indices.push(idx);
    man.nextData[existing] = nexts;
    console.log('after', man.nextData);
  }
}

export function removeComponent<T extends ComponentData>(
  man: ComponentManager<T>,
  eid: EntityId,
) {
  const idx = man.map.get(eid);
  if (!idx) return;

  const indicesToRemove = [idx];
  const nexts = man.nextData[idx];

  if (nexts) {
    indicesToRemove.push(...nexts.indices);
  }

  const keys = Object.keys(man.data) as (keyof typeof man.data)[];

  // Go backwards through the array to preserve earlier indices until we
  // process them.
  for (let i = indicesToRemove.length - 1; i >= 0; i--) {
    const idxToRemove = indicesToRemove[i];
    const lastIdx = man.entities.length - 1;
    const lastEntity = man.entities[lastIdx];

    man.entities[idxToRemove] = man.entities[lastIdx];
    man.entities.pop();

    for (let k = 0; k < keys.length; k++) {
      const key = keys[k];
      man.data[key][idxToRemove] = man.data[key][lastIdx];
      man.data[key].pop();
    }

    man.map.set(lastEntity, idx);
    man.map.delete(eid);
  }

  man.nextData[idx] = { indices: [] };
}

type PointMassComponentData = {
  mass: number[];
  cpos: Vector2[];
  ppos: Vector2[];
  acel: Vector2[];
};

interface ComponentData extends Record<string, unknown[]> {}

interface ComponentManagerDataLess {
  map: Map<EntityId, number>;
  nextData: { indices: number[] }[];
  entities: EntityId[];
}

interface ComponentManager<T extends ComponentData>
  extends ComponentManagerDataLess {
  data: T;
}

abstract class ComponentManagerImpl implements ComponentManagerDataLess {
  // has to be public so that there can be a shared implementation without inheritance!
  nextData: { indices: number[] }[] = [];
  entities: EntityId[] = [];
  map = new Map<EntityId, number>();
}

export class PointMassComponentMan
  extends ComponentManagerImpl
  implements ComponentManager<PointMassComponentData>
{
  data: PointMassComponentData = {
    mass: [],
    cpos: [],
    ppos: [],
    acel: [],
  };

  mass(handle: ComponentManagerHandle) {
    return this.data.mass[handle.idx];
  }

  cpos(handle: ComponentManagerHandle) {
    return this.data.cpos[handle.idx];
  }

  setCpos(
    handle: ComponentManagerHandle,
    value: PointMassComponentData['cpos'][number],
  ) {
    return (this.data.cpos[handle.idx] = value);
  }
}
