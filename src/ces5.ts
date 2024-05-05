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
  const idx = man.storage.entity.length;
  man.storage.entity[idx] = eid;

  for (let key of Object.keys(init) as (keyof typeof init)[]) {
    man.storage[key][idx] = init[key];
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

export function removeComponent<T extends ComponentData>(
  man: ComponentManager<T>,
  eid: EntityId,
  instToRemove?: ComponentInstanceHandle | null,
) {
  // Grab the storage lookup instance
  let inst = man.heads.get(eid) ?? null;
  if (!inst) return;

  // Grab the known keys of the storage. Since this is a generic function, we
  // need to extract them. There are also known keys that we added, so skip those.
  const keys = Object.keys(man.storage).filter(
    (k) => k !== 'entity',
  ) as (keyof typeof man.storage)[];

  // loop through the linked list of instances of this component.
  while (inst) {
    // if we're looking for a specific instance, only exec the remove for that
    // instance.
    if (instToRemove ? inst.storageIdx === instToRemove?.storageIdx : true) {
      // found it, remove it by swapping it with the last storage item and fix
      // up both linked lists!

      // STEP 1: move the last entity (e.g. "the replacer") to take the place of
      // the to-be-deleted instance, and fixup the instance's linked list
      const lastStorageIdx =
        man.storage.entity.length === 0 ? 0 : man.storage.entity.length - 1;
      const replacerEntity = man.storage.entity[lastStorageIdx];
      // SPECIAL CASE: only swap if this item is not already at the end and
      // there is space to swap!
      if (inst.storageIdx <= man.storage.entity.length - 1) {
        man.storage.entity[inst.storageIdx] = replacerEntity;
      }
      // remove the original, which is now a duplicate.
      man.storage.entity.pop();

      // STEP 2: fixup the linked list of instances so that their storageIdx is
      // accurate after being moved.
      const replacerInstanceHead = man.heads.get(replacerEntity);
      // find the instance that we just affected by the swap.
      let replacerInstance = replacerInstanceHead;
      while (replacerInstance && replacerInstance.storageIdx !== lastStorageIdx)
        replacerInstance = replacerInstance.next ?? undefined;
      // update the affected instance's storage to be the recently deleted's
      // storage.
      if (replacerInstance) replacerInstance.storageIdx = inst.storageIdx;

      // STEP 3: Actually move the storage location of the Replacer to be the
      // recently-deleted's location.
      for (let k = 0; k < keys.length; k++) {
        const key = keys[k];
        man.storage[key][inst.storageIdx] = man.storage[key][lastStorageIdx];
        man.storage[key].pop();
      }

      // STEP 4: Check if there are no more instances for the EntityId. If so,
      // forget the EntityId.
      const headInstance = man.heads.get(eid);
      if (headInstance?.storageIdx === inst.storageIdx && !headInstance.next) {
        man.heads.delete(eid);
      }
    }

    // continue to search for instances that need to be removed.
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
  // Returns the _head_ of the linked list of instances for an EntityId
  heads = new Map<EntityId, ComponentInstanceHandle>();

  // signals for external coordination
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
