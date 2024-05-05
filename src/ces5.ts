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

export type ComponentInstanceHandle = {
  storageIdx: number;
  prev: null | ComponentInstanceHandle;
  next: null | ComponentInstanceHandle;
};

/**
 * Aka an "instance of the component type used to lookup the component data"
 */
function makeInstanceHandle(storageIdx: number): ComponentInstanceHandle {
  return { storageIdx, prev: null, next: null };
}

export function lookup<T extends ComponentData>(
  man: ComponentManager<T>,
  eid: EntityId,
): ComponentInstanceHandle | null {
  const idx = man.map.get(eid);
  return idx ? idx : null;
}

export function has<T extends ComponentData>(
  man: ComponentManager<T>,
  eid: EntityId,
) {
  const idx = man.map.get(eid);
  return idx ? true : false;
}

export function addComponent<T extends ComponentData>(
  man: ComponentManager<T>,
  eid: EntityId,
  init: {
    [K in keyof T]: T[K][number];
  },
) {
  const idx = man.storage.entity.length;
  man.storage.entity[idx] = eid;

  for (let key of Object.keys(init) as (keyof typeof init)[]) {
    man.storage[key][idx] = init[key];
  }

  // Allow multiple instances of the component per ID!
  let inst = man.map.get(eid);
  if (!inst) {
    // This is the first
    inst = makeInstanceHandle(idx);
    man.map.set(eid, inst);
  } else {
    // This is not the first
    let leaf = inst;
    while (leaf && leaf.next !== null) leaf = leaf.next;
    leaf.next = makeInstanceHandle(idx);
    leaf.next.prev = leaf;
  }
  man.s.added.fire(eid);
}

export function removeComponent<T extends ComponentData>(
  man: ComponentManager<T>,
  eid: EntityId,
  instToRemove?: ComponentInstanceHandle | null,
) {
  let inst = man.map.get(eid) ?? null;
  if (!inst) return;

  const keys = Object.keys(man.storage) as (keyof typeof man.storage)[];

  let counter = 0;

  while (inst) {
    if (instToRemove ? inst.storageIdx === instToRemove?.storageIdx : true) {
      // found it, remove it by swapping it with the last storage item and fix up both linked lists!

      // move the last entity to take the place of the to be deleted instance,
      // and fixup the instance's linked list
      const lastStorageIdx =
        man.storage.entity.length === 0 ? 0 : man.storage.entity.length - 1;
      const replacerEntity = man.storage.entity[lastStorageIdx];
      if (inst.storageIdx <= man.storage.entity.length - 1) {
        // only swap if this item is not already at the end!
        man.storage.entity[inst.storageIdx] = replacerEntity;
      }
      man.storage.entity.pop();
      const replacerInstanceHead = man.map.get(replacerEntity);
      let replacerInstance = replacerInstanceHead;
      while (replacerInstance && replacerInstance.storageIdx !== lastStorageIdx)
        replacerInstance = replacerInstance.next ?? undefined;
      if (replacerInstance) replacerInstance.storageIdx = inst.storageIdx;

      // Move the last storage to be the deleted storage id.
      for (let k = 0; k < keys.length; k++) {
        const key = keys[k];
        if (key === 'entity') continue;
        man.storage[key][inst.storageIdx] = man.storage[key][lastStorageIdx];
        man.storage[key].pop();
      }

      const headInstance = man.map.get(eid);
      if (headInstance?.storageIdx === inst.storageIdx) {
        // we have just deleted the last instance of this entity, remove this entity as well.
        man.map.delete(eid);
      }
    }
    inst = inst.next;
  }

  man.s.removed.fire(eid);
}

/**
 * Good for singletons.
 */
export function firstComponent<T extends ComponentData>(
  man: ComponentManager<T>,
) {
  return man.storage.entity.at(0);
}

interface ComponentData extends Record<string, unknown[]> {}

// TODO: if I remove the generic, and just use `public data: ...`, is that good enough?
export class ComponentManager<T extends ComponentData = ComponentData> {
  // implements ComponentManager<T>
  map = new Map<EntityId, ComponentInstanceHandle>();
  // nextData: { head: ComponentInstanceHandle | null }[] = [];
  // entities: EntityId[] = [];
  s = {
    added: new Sig<EntityId>(),
    removed: new Sig<EntityId>(),
    destroyed: new Sig<void>(),
  };

  constructor(
    layout: T,
    public storage = {
      ...layout,
      entity: [] as EntityId[],
    },
  ) {}
  destroy() {
    this.s.destroyed.fire();
  }
}

class Sig<T> {
  private owners = new Map<unknown, (it: T) => void>();
  on(owner: unknown, cb: (it: T) => void) {
    this.owners.set(owner, cb);
  }

  off(owner: unknown) {
    this.owners.delete(owner);
  }

  fire(it: T) {
    for (const [owner, cb] of this.owners) cb(it);
  }
}

export class Query<
  T extends ComponentData,
  Musts extends ComponentManager<T>[],
  Nots extends ComponentManager<T>[],
> {
  entities = new Set<EntityId>();

  constructor(
    public musts: [...Musts],
    public nots?: [...Nots],
  ) {
    for (const man of musts) {
      man.s.added.on(this, (eid) => this.check(eid));
      man.s.removed.on(this, (eid) => this.remove(eid));
      man.s.destroyed.on(this, () => this.destroy());
      // Oof, very expensive!
      for (const e of man.storage.entity) this.check(e);
    }

    if (nots)
      for (const man of nots) {
        man.s.added.on(this, (eid) => this.remove(eid));
        man.s.removed.on(this, (eid) => this.check(eid));
        man.s.destroyed.on(this, () => this.destroy());
        // Oof, very expensive!
        for (const e of man.storage.entity) this.check(e);
      }
  }

  destroy() {
    for (const man of this.musts) {
      man.s.added.off(this);
      man.s.removed.off(this);
      man.s.destroyed.off(this);
    }
  }

  private check(eid: EntityId) {
    let all = true;
    for (const man of this.musts) {
      if (has(man, eid)) continue;
      else {
        all = false;
        break;
      }
    }

    if (this.nots)
      for (const man of this.nots) {
        if (has(man, eid)) {
          all = false;
          break;
        }
      }

    if (all) this.entities.add(eid);
    else this.entities.delete(eid);
  }

  private remove(eid: EntityId) {
    this.entities.delete(eid);
  }
}
