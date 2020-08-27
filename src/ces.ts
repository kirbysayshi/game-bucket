type SelectionHash = string;

export type EntityId = { id: number };

function isEntityId(obj: any): obj is EntityId {
  return obj && typeof obj === "object" && typeof obj.id === "number";
}

type EntityData = {
  k: string;
};

class CmpSelection<ED extends EntityData> {
  // selectionHash
  readonly sh: SelectionHash = CmpSelection.hash(this.kinds);
  // entities
  es = new Set<EntityId>();

  constructor(private readonly kinds: Readonly<ED["k"][]>) {}

  // insert
  ins(id: EntityId) {
    this.es.add(id);
  }

  // maybeInsert
  mbIns(id: EntityId, data: ED[]) {
    const dataKinds = data.map(d => d.k);
    const matches = this.kinds.every(k => dataKinds.indexOf(k) > -1);
    if (!matches || this.es.has(id)) return;
    this.es.add(id);
  }

  // maybeRemove
  mbRm(id: EntityId, data: ED[]) {
    const dataKinds = data.map(d => d.k);
    const matches = this.kinds.every(k => dataKinds.indexOf(k) > -1);
    if (!matches || !this.es.has(id)) return;
    this.es.delete(id);
  }

  static hash(kinds: Readonly<EntityData["k"][]>): SelectionHash {
    return kinds
      .slice()
      .sort()
      .join("|");
  }
}

// https://stackoverflow.com/a/50499316
export type NarrowComponent<T, N> = T extends { k: N } ? T : never;

export type AssuredEntityId<ED extends EntityData> = EntityId & {
  _assured: ED;
};

export class CES<ED extends EntityData> {
  // starting at 1 to avoid any falsy ids
  private lastId = 1;
  // entities
  private es = new Map<EntityId, ED[]>();
  // selections
  private ss = new Map<SelectionHash, CmpSelection<ED>>();
  // destroyNext
  private dn = new Set<EntityId>();

  entity<T extends ED>(
    initData: T[]
  ): AssuredEntityId<NarrowComponent<ED, T["k"]>> {
    // new entity, create components
    const id = { id: this.lastId++ };
    this.es.set(id, initData);
    this.ss.forEach(selection => selection.mbIns(id, initData));
    return id as AssuredEntityId<NarrowComponent<ED, T["k"]>>;
  }

  // // Add a component data to an existing entity
  // add<
  //   ExistingComponents extends ED,
  //   NewComponent extends Exclude<ED, ExistingComponents>
  // >(id: AssuredEntityId<ExistingComponents>, data: NewComponent) {
  //   const existing = this.es.get(id);
  //   if (process.env.NODE_ENV !== "production") {
  //     if (!existing) throw new Error(`Entity(${id}) not found!`);
  //     if (existing.findIndex(eData => eData.k === data.k) > -1)
  //       throw new Error(`Entity(${id}) already has a ${data.k} component!`);
  //   }

  //   // remove from existing selections
  //   this.ss.forEach(selection => selection.mbRm(id, existing!));

  //   // update existing entity
  //   existing!.push(data);
  //   this.es.set(id, existing!);

  //   // update any matching selections
  //   this.ss.forEach(selection => selection.mbIns(id, existing!));

  //   // the id is now UPGRADED
  //   return (id as number) as AssuredEntityId<ExistingComponents | NewComponent>;
  // }

  // remove<ExistingComponents extends ED>(
  //   id: AssuredEntityId<ExistingComponents>,
  //   k: ExistingComponents["k"]
  // ) {
  //   const existing = this.es.get(id);
  //   if (process.env.NODE_ENV !== "production") {
  //     if (!existing) throw new Error(`Entity(${id}) not found!`);
  //   }

  //   const idx = existing!.findIndex(eData => eData.k === k);

  //   if (process.env.NODE_ENV !== "production") {
  //     if (idx === -1)
  //       throw new Error(`Entity(${id}) does not have a ${k} component!`);
  //   }

  //   // remove from existing selections
  //   this.ss.forEach(selection => selection.mbRm(id, existing!));

  //   // update existing entity
  //   existing!.splice(idx, 1);
  //   this.es.set(id, existing!);

  //   // update any matching selections
  //   this.ss.forEach(selection => selection.mbIns(id, existing!));

  //   // the id is now DOWNGRADED
  //   return id as AssuredEntityId<Exclude<ExistingComponents["k"], typeof k>>;
  // }

  destroy(id: EntityId) {
    this.dn.add(id);
  }

  isDestroyed(id: EntityId) {
    return this.dn.has(id);
  }

  flushDestruction() {
    if (this.dn.size === 0) return;
    let reflush = false;

    const recurse = (obj: any) => {
      if (obj && typeof obj === "object" && !isEntityId(obj)) {
        Object.values(obj).forEach(value => {
          if (isEntityId(value)) {
            this.destroy(value);
            reflush = true;
          } else {
            recurse(value);
          }
        });
      }
    };

    this.dn.forEach(id => {
      this.dn.delete(id);
      if (!this.es.has(id)) return;
      const data = this.es.get(id)!;

      // recursively traverse the entities referenced by this component
      // and mark them for deletion.
      data.forEach(cmp => {
        recurse(cmp);
        // Object.values(cmp).forEach(value => {

        //   if (typeof value === 'object' && !isEntityId(value)) {

        //   }

        //   if (isEntityId(value)) {
        //     this.destroy(value);
        //     reflush = true;
        //   }
        // })
      });

      this.es.delete(id);
      this.ss.forEach(selection => selection.mbRm(id, data));
    });

    // We have found more entities to delete. Flush again!
    if (reflush) this.flushDestruction();
  }

  select<T extends ED["k"]>(kinds: Readonly<T[]>) {
    const hash = CmpSelection.hash(kinds);
    if (this.ss.has(hash))
      return this.ss.get(hash)!.es as Set<
        AssuredEntityId<NarrowComponent<ED, T>>
      >;
    const selection = new CmpSelection<ED>(kinds);
    this.ss.set(selection.sh, selection);

    this.es.forEach((data, id) => {
      let every = true;
      for (let i = 0; i < kinds.length; i++) {
        const kind = kinds[i];
        const d = data.find(d => d.k === kind);
        if (!d) every = false;
      }
      if (every) {
        selection.ins(id);
      }
    });

    return selection.es as Set<AssuredEntityId<NarrowComponent<ED, T>>>;
  }

  selectFirst<T extends ED["k"]>(kinds: Readonly<T[]>) {
    const entities = this.select(kinds);
    // 3.6 brings better iterator support, but is not passing the possibility
    // that the .value could be undefined and instead is passing `any` through.
    // Doing this helps.
    const next: IteratorResult<EntityId> = entities.values().next();
    return next.value as (AssuredEntityId<NarrowComponent<ED, T>> | undefined);
  }

  data<T extends ED, K extends T["k"]>(id: AssuredEntityId<T>, kind: K) {
    const entity = this.es.get(id);
    if (!entity) throw new Error(`Entity(${id}) not found!`);
    const data = entity.find(d => d.k === kind);
    if (!data) throw new Error(`Data(${kind}) not found for Entity(${id})!`);
    return data as NarrowComponent<ED, K>;
  }

  selectFirstData<K extends ED["k"]>(kind: K) {
    const id = this.selectFirst([kind]);
    if (!id) return undefined;
    const data = this.data(id, kind);
    return data;
  }
}
