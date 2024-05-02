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

interface ComponentManager<T> {
  get(id: EntityId): T | undefined;
}

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

export function lookup(man: PointMassComponentMan, eid: EntityId) {
  const idx = man.map.get(eid);
  return idx ? { idx } : null;
}

type PointMassComponentData = {
  entity: EntityId[];
  mass: number[];
  cpos: Vector2[];
  ppos: Vector2[];
  acel: Vector2[];
  nextData: { indices: number[] }[];
};

export class PointMassComponentMan {
  private data: PointMassComponentData = {
    entity: [],
    mass: [],
    cpos: [],
    ppos: [],
    acel: [],
    nextData: [],
  };

  // has to be public so that lookups can be shared impl
  public map = new Map<EntityId, number>();

  // extract add and remove as standalone functions addComponent, removeComponent

  add(init: {
    [K in Exclude<
      keyof PointMassComponentData,
      'nextData'
    >]: PointMassComponentData[K][number];
  }) {
    const eid = init.entity;
    const idx = this.data.entity.length || 1;
    for (let key of Object.keys(init) as (keyof typeof init)[]) {
      this.data[key][idx] = init[key];
    }

    // Allow multiple instances of the component per ID!
    const existing = this.map.get(eid);
    if (!existing) {
      // This is the first
      this.map.set(eid, idx);
      return true;
    } else {
      // This is not the first
      const nexts = this.data.nextData[existing] ?? { indices: [] };
      nexts.indices.push(idx);
      this.data.nextData[existing] = nexts;
    }
  }

  remove(eid: EntityId) {
    const idx = this.map.get(eid);
    if (!idx) return;

    const indicesToRemove = [idx];
    const nexts = this.data.nextData[idx];

    if (nexts) {
      indicesToRemove.push(...nexts.indices);
    }

    // Go backwards through the array to preserve earlier indices until we
    // process them.
    for (let i = indicesToRemove.length - 1; i >= 0; i--) {
      const idxToRemove = indicesToRemove[i];
      const lastIdx = this.data.entity.length - 1;
      const lastEntity = this.data.entity[lastIdx];
      this.data.entity[idxToRemove] = this.data.entity[lastIdx];
      this.data.mass[idxToRemove] = this.data.mass[lastIdx];
      this.data.cpos[idxToRemove] = this.data.cpos[lastIdx];
      this.data.ppos[idxToRemove] = this.data.ppos[lastIdx];
      this.data.acel[idxToRemove] = this.data.acel[lastIdx];

      this.data.entity.pop();
      this.data.mass.pop();
      this.data.cpos.pop();
      this.data.ppos.pop();
      this.data.acel.pop();

      this.map.set(lastEntity, idx);
      this.map.delete(eid);
    }

    this.data.nextData[idx] = { indices: [] };
  }

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
