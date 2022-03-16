/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

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
export type AssuredEntityId<ED extends EntityData> = EntityId & {
  _assured: ED;
};
export type AssuredBorrowedEntityId<ED extends EntityData> =
  BorrowedEntityId & {
    _assured: ED;
  };

export function downgradeAssuredEntityId<
  C extends EntityData,
  K extends C['k']
>(eid: AssuredEntityId<C>, k: K) {
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

type EntityData = {
  k: string;
};

/**
 * This class follows the Entity Component System Pattern often found in game
 * development. It is a data-oriented pattern that allows Entities (an id) to be
 * the primary lookup key for Components (the actual data instance).
 */

export class CES3<ED extends EntityData> {
  private lastId = -1;

  private ids: (EntityId | undefined)[];
  private destroyed = new Set<number>();

  // the index of each array is the entity id
  private cmpToIdArr = new Map<ED['k'], (ED | undefined)[]>();

  constructor(private initialMaxDataCount = 100) {
    this.ids = new Array(initialMaxDataCount);
  }

  private nextId(): EntityId {
    while (true) {
      const test = ++this.lastId;
      if (test < this.initialMaxDataCount) {
        if (this.ids[test]) continue;
        else {
          return (this.ids[test] = { id: test, owned: true, destroyed: false });
        }
      } else {
        // expand and reset
        this.lastId = -1;
        const max = (this.initialMaxDataCount = this.initialMaxDataCount * 10);

        if (
          process.env.NODE_ENV !== 'production' &&
          process.env.NODE_ENV !== 'test'
        ) {
          console.info(`expanding CES to ${max}`, this);
        }

        // Expand ID Array
        const nextIds = new Array(max);
        for (let i = 0; i < this.ids.length; i++) {
          nextIds[i] = this.ids[i];
        }
        this.ids = nextIds;

        // Expand each data array
        for (const [kind, datas] of this.cmpToIdArr) {
          const next = new Array(max);
          for (let i = 0; i < datas.length; i++) {
            next[i] = datas[i];
          }
          this.cmpToIdArr.set(kind, next);
        }
      }
    }
  }

  allEntities() {
    return this.ids as readonly (EntityId | undefined)[];
  }

  destroy(eid: EntityId): void {
    eid.destroyed = true;
    this.destroyed.add(eid.id);
  }

  isDestroyed(eid: EntityId): boolean {
    return eid.destroyed || this.destroyed.has(eid.id) || !this.ids[eid.id];
  }

  flushDestruction(): void {
    if (this.destroyed.size === 0) return;
    let reflush = false;

    const recurse = (obj: unknown) => {
      if (obj && typeof obj === 'object' && !isEntityId(obj)) {
        Object.values(obj).forEach((value) => {
          if (isOwnedEntityId(value) && !isBorrowedEntityId(value)) {
            this.destroy(value);
            reflush = true;
          } else {
            recurse(value);
          }
        });
      }
    };

    this.destroyed.forEach((id) => {
      this.destroyed.delete(id);
      this.ids[id] = undefined;

      for (const [, datas] of this.cmpToIdArr) {
        const data = datas[id];
        if (!data) continue;
        recurse(data);
        datas[id] = undefined;
      }
    });

    // We have found more entities to delete. Flush again!
    if (reflush) this.flushDestruction();
  }

  entity<T extends ED>(initData: T[]) {
    const eid = this.nextId();

    for (let i = 0; i < initData.length; i++) {
      const data = initData[i];
      this.add(eid as AssuredEntityId<NarrowComponent<ED, T['k']>>, data);
    }

    return eid as AssuredEntityId<
      NarrowComponent<ED, typeof initData[number]['k']>
    >;
  }

  // There is actually no guarantee the id is still valid, so this should return optional undefined...

  data<T extends ED, K extends T['k']>(
    eid: AssuredEntityId<T> | undefined,
    kind: K
  ) {
    if (!eid || eid.destroyed) return;
    const datas = this.cmpToIdArr.get(kind);
    if (process.env.NODE_ENV !== 'production') {
      if (!datas) throw new Error('No component datas!');
    }
    return datas?.[eid.id] as NarrowComponent<T, K> | undefined;
  }

  dataMaybe<T extends ED, K extends T['k']>(
    eid: EntityId | undefined,
    kind: K
  ): NarrowComponent<T, K> | undefined {
    if (!eid || eid.destroyed) return;
    const datas = this.cmpToIdArr.get(kind);
    if (process.env.NODE_ENV !== 'production') {
      if (!datas) throw new Error('No component datas!');
    }
    return datas?.[eid.id] as NarrowComponent<T, K> | undefined;
  }

  add<T extends ED, Existing extends ED>(
    eid: AssuredEntityId<Existing> | EntityId,
    initData: T
  ) {
    if (eid.destroyed) return;
    const datas =
      this.cmpToIdArr.get(initData.k) ?? Array(this.initialMaxDataCount);
    // TODO: what if data already exists? Destroy?
    datas[eid.id] = initData;
    this.cmpToIdArr.set(initData.k, datas);
    // the id is now UPGRADED
    // return eid as AssuredEntityId<T>;
    return eid as EntityId as AssuredEntityId<
      NarrowComponent<ED, Existing['k'] | typeof initData['k']>
    >;
  }

  remove<ExistingComponents extends ED>(
    eid: EntityId,
    kind: ExistingComponents['k']
  ): EntityId;
  remove<ExistingComponents extends ED>(
    eid: AssuredEntityId<ExistingComponents>,
    kind: ExistingComponents['k']
  ): AssuredEntityId<Exclude<ExistingComponents['k'], typeof kind>>;
  remove<ExistingComponents extends ED>(
    eid: AssuredEntityId<ExistingComponents> | EntityId,
    kind: ExistingComponents['k']
  ) {
    if (eid.destroyed) return;
    const datas = this.cmpToIdArr.get(kind);
    if (!datas) return eid;
    datas[eid.id] = undefined;
    return eid as AssuredEntityId<
      Exclude<ExistingComponents['k'], typeof kind>
    >;
  }

  has<ExistingComponents extends ED>(
    eid: EntityId,
    kind: ExistingComponents['k']
  ) {
    const datas = this.cmpToIdArr.get(kind);
    if (eid.destroyed || !datas || !datas[eid.id]) return false;
    return true;
  }

  select<T extends ED['k']>(kinds: T[]) {
    const matching = new Set<EntityId>();

    for (let i = 0; i < kinds.length; i++) {
      const kind = kinds[i];
      const datas = this.cmpToIdArr.get(kind);
      if (!datas) return [];
      if (matching.size === 0) {
        for (let k = 0; k < datas.length; k++) {
          const data = datas[k];
          if (data !== undefined) matching.add(this.ids[k] as EntityId);
        }
      } else {
        for (const eid of matching.values()) {
          if (datas[eid.id] === undefined) matching.delete(eid);
        }
      }
    }

    return [...matching] as AssuredEntityId<NarrowComponent<ED, T>>[];
  }

  selectData<T extends ED['k']>(kind: T) {
    const datas = this.cmpToIdArr.get(kind);
    if (!datas) return [];
    return datas as Readonly<(NarrowComponent<ED, T> | undefined)[]>;
  }

  selectFirst(kinds: ED['k'][]) {
    const selection = this.select(kinds);
    if (selection.length === 0) return undefined;
    return selection[0];
  }

  selectFirstData<T extends ED['k']>(kind: T) {
    const datas = this.cmpToIdArr.get(kind);
    if (process.env.NODE_ENV !== 'production') {
      if (!datas) throw new Error('No component datas!');
    }
    if (!datas) return;
    for (let i = 0; i < datas.length; i++) {
      const data = datas[i];
      if (data !== undefined) return data as NarrowComponent<ED, T>;
    }
  }
}
