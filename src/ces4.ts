// The primary key into the component data. If `destroyed`, then this key is
// considered dead and components cannot be added or removed.
export type EntityId = { id: number; owned: boolean; destroyed: boolean };

// An "Owned" or "Borrowed" EntityId is generally used when destroying an
// EntityId that has a component that references another EntityId. If the ID is
// owned by the component data, that ID will also be destroyed. If the ID is
// merely borrowed, it will not be destroyed.
export type OwnedEntityId = { id: number; owned: true; destroyed: boolean };
export type BorrowedEntityId = { id: number; owned: false; destroyed: boolean };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isEntityId(obj: any): obj is EntityId {
  return obj && typeof obj === 'object' && typeof obj.id === 'number';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isOwnedEntityId(obj: any): obj is OwnedEntityId {
  const id = isEntityId(obj);
  return id && obj.owned === true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isBorrowedEntityId(obj: any): obj is BorrowedEntityId {
  const id = isEntityId(obj);
  return id && obj.owned === false;
}

export type NarrowComponent<T, N> = T extends { k: N } ? T : never;


// An "Assured" EntityId had, at the time it was returned, the specified
// component data types. It might not still have those types if the data has
// been removed from the Entity, or if the entity has been deleted. "Assured"
// means, "mostly assured that these types were attached".
export type AssuredEntityId<ED extends EntityData> = EntityId & {
  _assured: ED;
};
export type AssuredBorrowedEntityId<ED extends EntityData> =
  BorrowedEntityId & {
    _assured: ED;
  };

/**
 * Take an entity id with multiple data types, like v-movement | something-else,
 * and narrow it to just K. Useful when assigning an entityId to a function
 * signature or other type.
 */
export function narrowAssuredEntityId<C extends EntityData, K extends C['k']>(
  eid: AssuredEntityId<C>,
  k: K
) {
  return eid as AssuredEntityId<NarrowComponent<C, typeof k>>;
}

export function borrowEntityId(id: EntityId) {
  const next: BorrowedEntityId = { ...id, owned: false };
  return next;
}

export function borrowAssuredEntityId<C extends EntityData>(
  id: AssuredEntityId<C>
) {
  const next: AssuredBorrowedEntityId<C> = { ...id, owned: false };
  return next;
}

interface EntityData {
  k: string;
}

function isEqualSets(a: Set<unknown>, b: Set<unknown>) {
  if (a === b) return true;
  if (a.size !== b.size) return false;
  for (const value of a) if (!b.has(value)) return false;
  return true;
}

function isSetContainedWithinSet(a: Set<unknown>, b: Set<unknown>) {
  if (a === b) return true;
  for (const value of a) if (!b.has(value)) return false;
  return true;
}

class Index<ED extends EntityData, K extends ED['k']> extends Set<EntityId> {
  constructor(public kinds: Set<K>) {
    super();
  }
  matchesKind(k: K) {
    return this.kinds.has(k);
  }
  matchesQuery<ED extends EntityData>(q: Query<ED>): boolean {
    return isEqualSets(q.kinds, this.kinds);
  }
  isSubsetOf<ED extends EntityData>(other: Set<ED['k']>) {
    return isSetContainedWithinSet(this.kinds, other);
  }
}

class Query<T extends EntityData> {
  constructor(
    initialKinds?: T['k'][],
    public kinds = new Set<T['k']>(initialKinds)
  ) {}
}

/**
 * This class follows the Entity Component System Pattern often found in game
 * development. It is a data-oriented pattern that allows Entities (an id) to be
 * the primary lookup key for Components (the actual data instance).
 */
export class CES4<ED extends EntityData> {
  private lastId = 0;
  private indicies: Index<ED, ED['k']>[] = [];
  private collections = new Map<ED['k'], Map<EntityId, ED>>();
  private eids = new Set<EntityId>();
  private destroyed = new Set<EntityId>();

  allEntities() {
    return [...this.eids] as readonly EntityId[];
  }

  private getOrCreateCollection<T extends ED>(k: T['k']) {
    let collection = this.collections.get(k);
    if (!collection) {
      collection = new Map<EntityId, ED>();
      this.collections.set(k, collection);
    }
    return collection;
  }

  destroy(eid: EntityId | undefined | null): void {
    if (!eid) return;
    eid.destroyed = true;
    this.destroyed.add(eid);
  }

  isDestroyed(eid: EntityId): boolean {
    return eid.destroyed || this.destroyed.has(eid) || !this.eids.has(eid);
  }

  flushDestruction(): void {
    if (this.destroyed.size === 0) return;
    let reflush = false;

    const recurse = (obj: unknown) => {
      if (obj && typeof obj === 'object' && !isEntityId(obj)) {
        for (const value of Object.values(obj)) {
          if (isOwnedEntityId(value) && !isBorrowedEntityId(value)) {
            this.destroy(value);
            reflush = true;
          } else {
            recurse(value);
          }
        }
      }
    };

    for (const eid of this.destroyed) {
      this.destroyed.delete(eid);
      this.eids.delete(eid);

      for (const [, collection] of this.collections) {
        const data = collection.get(eid);
        if (!data) continue;
        recurse(data);
        collection.delete(eid);
      }

      for (const index of this.indicies) {
        index.delete(eid);
      }
    }

    // We have found more entities to delete. Flush again!
    if (reflush) this.flushDestruction();
  }

  entity<T extends ED>(initData: T[]) {
    const id = this.lastId++;
    const eid: EntityId = { id, destroyed: false, owned: true };
    this.eids.add(eid);

    const kinds = new Set<string>();
    for (let i = 0; i < initData.length; i++) {
      const data = initData[i];
      kinds.add(data.k);
      this.add(eid, data, true);
    }

    // We skipped index updating before, manually update matching indices.
    for (const index of this.indicies) {
      // exact match, OR the index is less-broad than the component (subset)
      if (index.isSubsetOf(kinds)) index.add(eid);
    }

    return eid as AssuredEntityId<
      NarrowComponent<ED, (typeof initData)[number]['k']>
    >;
  }

  /**
   * Even with an AssuredEntityId, there is actually no guarantee the id is
   * still valid, so this returns optional undefined. A `select` could have
   * occurred in a previous frame, or it could be an ID stashed on another
   * entity.
   */
  data<T extends ED, K extends T['k']>(
    eid: AssuredEntityId<T> | undefined,
    kind: K,
  ) {
    if (!eid || eid.destroyed) return;
    const datas = this.collections.get(kind);
    return datas?.get(eid) as NarrowComponent<T, K> | undefined;
  }

  add<T extends ED, Existing extends ED>(
    eid: AssuredEntityId<Existing> | EntityId,
    initData: T,
    skipIndicesUpdate = false,
  ) {
    if (eid.destroyed) return;
    const collection = this.getOrCreateCollection(initData.k);
    collection.set(eid, initData);

    if (!skipIndicesUpdate) {
      const kinds = new Set<string>();
      for (const [kind, collection] of this.collections) {
        if (collection.has(eid)) kinds.add(kind);
      }

      // check each index. If every kind of the index is found in the known list
      // of collections this entity is within, then insert the entity into the
      // collection.
      for (const index of this.indicies) {
        if (index.isSubsetOf(kinds)) index.add(eid);
      }
    }

    // Return UPGRADED eid
    return eid as EntityId as AssuredEntityId<
      NarrowComponent<ED, Existing['k'] | (typeof initData)['k']>
    >;
  }

  remove<ExistingComponents extends ED>(
    eid: EntityId,
    kind: ExistingComponents['k'],
    skipIndicesUpdate?: boolean,
  ): EntityId;
  remove<ExistingComponents extends ED>(
    eid: AssuredEntityId<ExistingComponents>,
    kind: ExistingComponents['k'],
    skipIndicesUpdate?: boolean,
  ): AssuredEntityId<Exclude<ExistingComponents['k'], typeof kind>>;
  remove<ExistingComponents extends ED>(
    eid: AssuredEntityId<ExistingComponents> | EntityId,
    kind: ExistingComponents['k'],
    skipIndicesUpdate = false,
  ) {
    if (eid.destroyed) return;

    if (!skipIndicesUpdate) {
      for (const index of this.indicies) {
        if (index.matchesKind(kind)) index.delete(eid);
      }
    }

    const collection = this.collections.get(kind);
    if (!collection) return eid;
    collection.delete(eid);

    return eid as AssuredEntityId<
      Exclude<ExistingComponents['k'], typeof kind>
    >;
  }

  has<ExistingComponents extends ED>(
    eid: EntityId,
    kind: ExistingComponents['k'],
  ) {
    const datas = this.collections.get(kind);
    if (eid.destroyed || !datas || !datas.get(eid)) return false;
    return true;
  }

  createQuery<K extends ED['k']>(kinds: K[]) {
    return new Query<NarrowComponent<ED, K>>(kinds);
  }

  forgetQuery<Q extends ED>(q: Query<Q>) {
    for (let i = 0; i < this.indicies.length; i++) {
      const index = this.indicies[i];
      if (index.matchesQuery(q)) {
        this.indicies.splice(i, 1);
        i -= 1;
      }
    }
  }

  select<Q extends ED, K extends Q['k']>(q: Query<Q>) {
    for (const index of this.indicies) {
      if (index.matchesQuery(q))
        return index as unknown as Set<AssuredEntityId<NarrowComponent<ED, K>>>;
    }

    const index = new Index<ED, ED['k']>(new Set(q.kinds));
    this.indicies.push(index);

    for (const kind of q.kinds) {
      const collection = this.collections.get(kind);
      if (!collection) {
        // cannot continue, return empty
        return index as unknown as Set<AssuredEntityId<NarrowComponent<ED, K>>>;
      }

      if (index.size === 0)
        for (const eid of collection.keys()) {
          index.add(eid);
        }
      else {
        for (const eid of index) {
          if (!collection.has(eid)) index.delete(eid);
        }
      }
    }

    return index as unknown as Set<AssuredEntityId<NarrowComponent<ED, K>>>;
  }

  selectData<T extends ED['k']>(kind: T) {
    const collection = this.getOrCreateCollection(kind);
    return collection as Map<
      AssuredEntityId<NarrowComponent<ED, T>>,
      NarrowComponent<ED, T>
    >;
  }

  selectFirst(q: Query<ED>) {
    const index = this.select(q);
    for (const item of index) {
      return item;
    }
  }

  selectFirstData<T extends ED['k']>(kind: T) {
    const collection = this.collections.get(kind);
    if (process.env.NODE_ENV !== 'production') {
      if (!collection) throw new Error(`No component datas! ${kind}`);
    }
    if (!collection) return;
    for (const [, data] of collection) {
      return data as NarrowComponent<ED, T>;
    }
  }
}
