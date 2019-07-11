type SelectionHash = string;

class CmpSelection {
  
  readonly selectionHash: SelectionHash = CmpSelection.hash(this.kinds);
  entities = new Set<EntityId>();

  constructor(private readonly kinds: EntityData['k'][]) {
  }

  insert(id: EntityId) {
    this.entities.add(id);
  }

  maybeInsert(id: EntityId, data: EntityData[]) {
    const cmpHash = CmpSelection.hash(data.map(d => d.k));
    if (this.selectionHash.indexOf(cmpHash) === -1 || this.entities.has(id)) return;
    this.entities.add(id);
  }

  maybeRemove(id: EntityId, data: EntityData[]) {
    const cmpHash = CmpSelection.hash(data.map(d => d.k));
    if (this.selectionHash.indexOf(cmpHash) === -1 || !this.entities.has(id)) return;
    this.entities.delete(id);
  }

  static hash(kinds: EntityData['k'][]): SelectionHash {
    return kinds.sort().join('|');
  }
}

class CmpStore {
  private lastId = 0;
  private entities = new Map<EntityId, EntityData[]>();
  private selections = new Map<SelectionHash, CmpSelection>();
  private destroyNext = new Set<EntityId>();

  entity(initData: EntityData[]): EntityId {
    // new entity, create components
    const id = this.lastId++;
    this.entities.set(id, initData);
    this.selections.forEach(selection => selection.maybeInsert(id, initData))
    return id;
  }

  destroy(id: EntityId) {
    this.destroyNext.add(id);
  }

  flushDestruction() {
    this.destroyNext.forEach((id) => {
      if (!this.entities.has(id)) return;
      const data = this.entities.get(id)!;
      this.entities.delete(id);
      this.selections.forEach(selection => selection.maybeRemove(id, data));
    })
  }

  select(kinds: EntityData['k'][]): Set<EntityId> {
    const hash = CmpSelection.hash(kinds);
    if (this.selections.has(hash)) return this.selections.get(hash)!.entities;
    const selection = new CmpSelection(kinds);
    this.selections.set(selection.selectionHash, selection);

    this.entities.forEach((data, id) => {
      let every = true;
      for (let i = 1; i < kinds.length; i++) {
        const kind = kinds[i];
        const d = data.find(d => d.k === kind);
        if (!d) every = false;
      }
      if (every) {
        selection.insert(id);
      }
    })

    return selection.entities;
  }

  data
    <T extends EntityData>
    (id: EntityId, kind: T['k']): T {
      const entity = this.entities.get(id);
      if (!entity) throw new Error(`Entity(${id}) not found!`);
      const data = entity.find(d => d.k === kind);
      if (!data) throw new Error(`Data(${kind}) not found for Entity(${id})!`)
      return data as T;
  }
}

// CR stands for "ComponentRegistration"
const CPOS = 'cpos';
type CposCR = {
  k: typeof CPOS;
  x: number;
  y: number;
}

const TEXT = 'text';
type TextCR = {
  k: typeof TEXT;
  v: string;
}

const PPOS = 'ppos';
type PposCR = {
  k: typeof PPOS;
  x: number;
  y: number;
}

// type Cmp<R> = Omit<R, 'k'>;
// const pos: Cmp<CposCR> = { x: 1, y: 2 };

type EntityId = number;
type EntityData = CposCR | TextCR | PposCR;

const store = new CmpStore();
store.entity([
  { k: TEXT, v: 'hello'},
  { k: CPOS, x: 1, y: 1 }
])

const ids = store.select([TEXT, CPOS]);
const cpos = store.data(Array.from(ids)[0], CPOS);
console.log(ids, cpos);

