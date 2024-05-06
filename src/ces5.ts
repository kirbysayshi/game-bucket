import { assertDefinedFatal } from './utils';

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
  private men: Set<ComponentManager> = new Set();

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
    eid.destroyed = true;
    this.men.forEach((man) => removeComponent(man, eid));
  }

  /**
   * Technically this is optional, but allows destroying an entity to also clean
   * up components automatically!
   */
  register(...men: ComponentManager[]) {
    men.forEach((m) => this.men.add(m));
    return this;
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
  const idx = man.heads.get(eid);
  return idx ? idx : null;
}

export function has<T extends ComponentData>(
  man: ComponentManager<T>,
  eid: EntityId,
) {
  const idx = man.heads.get(eid);
  return idx ? true : false;
}

export function addComponent<T extends ComponentData>(
  man: ComponentManager<T>,
  eid: EntityId,
  init: {
    [K in keyof T]: T[K][number];
  },
) {
  const idx = man.entityStorage.length;
  man.entityStorage[idx] = eid;

  for (let key of Object.keys(init) as (keyof typeof init)[]) {
    // lazy initialize, will only happen for the first component of the manager
    let storage = man.storage[key] ?? [];
    storage[idx] = init[key];
    man.storage[key] = storage;
  }

  // Allow multiple instances of the component per ID!
  let inst = man.heads.get(eid);
  if (!inst) {
    // This is the first
    inst = makeInstanceHandle(idx);
    man.heads.set(eid, inst);
  } else {
    // This is not the first
    let leaf = inst;
    while (leaf && leaf.next !== null) leaf = leaf.next;
    leaf.next = makeInstanceHandle(idx);
    leaf.next.prev = leaf;
  }
  man.s.added.fire(eid);
}

function removeComponentInstance<T extends ComponentData>(
  man: ComponentManager<T>,
  eid: EntityId,
  inst: ComponentInstanceHandle,
) {
  // 1. update entity storage
  // 2. update instance storage id
  // 3. update storage
  // 4. update linked list
  // 5. check/update heads

  // Grab the known keys of the storage. Since this is a generic function, we
  // need to extract them.
  const keys = Object.keys(man.storage) as (keyof typeof man.storage)[];

  // 1: delete by replacing with the last item
  const lastStorageIdx =
    man.entityStorage.length === 0 ? 0 : man.entityStorage.length - 1;
  const replacerEntity = man.entityStorage[lastStorageIdx];
  // SPECIAL CASE: only swap if this item is not already at the end and
  // there is space to swap!
  if (inst.storageIdx <= man.entityStorage.length - 1) {
    man.entityStorage[inst.storageIdx] = replacerEntity;
  }
  // remove the original, which is now a duplicate.
  man.entityStorage.pop();

  // 2: update the instance storage id to match it's upcoming storage location.
  // First we have to find it, since all we have is the storageIdx and the head
  // of the list it is within.
  const replacerHeadInst = man.heads.get(replacerEntity);
  if (replacerHeadInst) {
    let replacerInst: ComponentInstanceHandle | null | undefined =
      replacerHeadInst;
    while (replacerInst && replacerInst.storageIdx !== lastStorageIdx)
      replacerInst = replacerInst.next;
    if (replacerInst) replacerInst.storageIdx = inst.storageIdx;
  }

  // 3: update the storage to the new location
  for (let k = 0; k < keys.length; k++) {
    const key = keys[k];
    const storage = man.storage[key] ?? [];
    storage[inst.storageIdx] = storage[lastStorageIdx];
    storage.pop();
    man.storage[key] = storage;
  }

  // 4 & 5: remove the instance from the linked list and check if we need a new
  // head to be registered

  if (inst.prev) inst.prev.next = inst.next;
  if (inst.next) inst.next.prev = inst.prev;

  // 5
  if (!inst.prev) {
    // this was a head, there is a new head now
    if (inst.next) man.heads.set(eid, inst.next);
    // there is no new head, this was the only instance
    else man.heads.delete(eid);
  }

  inst.prev = null;
  inst.next = null;
}

export function removeComponent<T extends ComponentData>(
  man: ComponentManager<T>,
  eid: EntityId,
  instToRemove?: ComponentInstanceHandle | null,
) {
  if (instToRemove) removeComponentInstance(man, eid, instToRemove);
  else {
    const instancesToRemove = [];
    {
      let inst: ComponentInstanceHandle | null | undefined = man.heads.get(eid);
      if (!inst) return;
      while (inst) {
        instancesToRemove.push(inst);
        inst = inst.next;
      }
    }

    for (const inst of instancesToRemove) {
      removeComponentInstance(man, eid, inst);
    }
  }

  man.s.removed.fire(eid);
}

/**
 * Good for singletons.
 */
export function firstComponent<T extends ComponentData>(
  man: ComponentManager<T>,
) {
  return man.entityStorage.at(0);
}

interface ComponentData extends Record<string, unknown[]> {}

// TODO: if I remove the generic, and just use `public data: ...`, is that good enough?
export class ComponentManager<T extends ComponentData = ComponentData> {
  // Returns the _head_ of the linked list of instances for an EntityId
  heads = new Map<EntityId, ComponentInstanceHandle>();

  // signals for external coordination
  s = {
    added: new Sig<EntityId>(),
    removed: new Sig<EntityId>(),
    destroyed: new Sig<void>(),
  };

  // These should actually be one Record, but TS is not expressive enough to
  // allow a  Record to have both known and Generic keys. These arrays will
  // always be the same length.
  public storage: { [K in keyof T]?: unknown[] } = {};
  public entityStorage: EntityId[] = [];

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
      for (const e of man.entityStorage) this.check(e);
    }

    if (nots)
      for (const man of nots) {
        man.s.added.on(this, (eid) => this.remove(eid));
        man.s.removed.on(this, (eid) => this.check(eid));
        man.s.destroyed.on(this, () => this.destroy());
        // Oof, very expensive!
        for (const e of man.entityStorage) this.check(e);
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
