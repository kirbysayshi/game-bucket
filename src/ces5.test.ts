import { Vector2, v2 } from 'pocket-physics';
import {
  AsComponentData,
  ComponentInstanceHandle,
  ComponentManager,
  EntityId,
  EntityManager,
  Query,
  addComponent,
  borrowEntityId,
  createEntity,
  destroyEntity,
  lookup,
  registerComponentMan,
  removeComponent,
} from './ces5';

export class PointMassComponentMan extends ComponentManager<{
  mass: number[];
  cpos: Vector2[];
  ppos: Vector2[];
  acel: Vector2[];
}> {
  // Example of retrieving all by entity id. Multiple component instances is a
  // rare case, most likely getting the first handle via `lookup` will suffice.
  masses(eid: EntityId) {
    const all = [];
    const handle = lookup(this, eid);
    let n = handle;
    while (n) {
      if (n) {
        const m = this.storage.mass?.[n.storageIdx];
        all.push(m);
      }
      n = n.next;
    }
    return all;
  }

  // example of accepting a handle to read the data without manual indexing.
  mass(handle: ComponentInstanceHandle | null) {
    if (!handle) return;
    return this.storage.mass?.[handle.storageIdx];
  }

  cpos(handle: ComponentInstanceHandle | null) {
    if (!handle) return;
    return this.storage.cpos?.[handle.storageIdx];
  }

  setCpos(handle: ComponentInstanceHandle | null, value: Vector2) {
    if (!handle || !this.storage.cpos) return;
    return (this.storage.cpos[handle.storageIdx] = value);
  }
}

test('entity create', async () => {
  const eman = new EntityManager();
  expect(() => {
    while (true) {
      createEntity(eman);
    }
  }).toThrowErrorMatchingInlineSnapshot(`"expected true, got false: 4194304"`);
});

test('remove head component', () => {
  const man1 = new ComponentManager<{ mass1: number[] }>();
  const eman = new EntityManager();

  const e0 = createEntity(eman);
  addComponent(man1, e0, { mass1: 1 });
  addComponent(man1, e0, { mass1: 2 });

  const head = lookup(man1, e0);
  expect(head?.storageIdx).toBe(0);
  expect(head?.next?.storageIdx).toBe(1);

  // console.dir(man1, { depth: 999 });

  removeComponent(man1, eman, e0, head);

  // console.dir(man1, { depth: 999 });

  const newHead = lookup(man1, e0);
  expect(newHead?.storageIdx).toBe(0);
  expect(newHead?.next).toBe(null);
});

test('multiple same-type components per entity', () => {
  const pointman = new PointMassComponentMan();
  const eman = new EntityManager();
  registerComponentMan(eman, pointman);

  const e0 = createEntity(eman);

  addComponent(pointman, e0, {
    acel: v2(),
    ppos: v2(),
    cpos: v2(),
    mass: 0,
  });

  addComponent(pointman, e0, {
    acel: v2(),
    ppos: v2(),
    cpos: v2(),
    mass: 1,
  });

  addComponent(pointman, e0, {
    acel: v2(),
    ppos: v2(),
    cpos: v2(),
    mass: 2,
  });

  expect(pointman.entityStorage[0]).toBe(e0);
  expect(pointman.entityStorage[1]).toBe(e0);
  expect(pointman.entityStorage[2]).toBe(e0);

  expect(pointman.storage.mass![0]).toBe(0);
  expect(pointman.storage.mass![1]).toBe(1);
  expect(pointman.storage.mass![2]).toBe(2);

  expect(lookup(pointman, e0)?.storageIdx).toBe(0);
  expect(lookup(pointman, e0)?.next?.storageIdx).toBe(1);
  expect(lookup(pointman, e0)?.next?.next?.storageIdx).toBe(2);

  const e1 = createEntity(eman);
  addComponent(pointman, e1, {
    acel: v2(1, 1),
    ppos: v2(1, 1),
    cpos: v2(1, 1),
    mass: 5,
  });
  addComponent(pointman, e1, {
    acel: v2(1, 1),
    ppos: v2(1, 1),
    cpos: v2(1, 1),
    mass: 6,
  });

  const h = lookup(pointman, e0);
  expect(h).toBeTruthy();
  if (!h) return;

  pointman.setCpos(h, v2(1, 1));
  expect(pointman.cpos(h)).toStrictEqual(v2(1, 1));

  removeComponent(pointman, eman, e0);

  expect(pointman.entityStorage[0]).toBe(e1);
  expect(lookup(pointman, e1)?.storageIdx).toBe(1);
  expect(lookup(pointman, e1)?.next?.storageIdx).toBe(0);
  expect(lookup(pointman, e0)).toBeNull();

  expect(pointman.mass(lookup(pointman, e1))).toBe(5);
  expect(pointman.mass(lookup(pointman, e1)?.next ?? null)).toBe(6);
});

test('entity query', () => {
  const man1 = new ComponentManager<{ mass1: number[] }>();
  const man2 = new ComponentManager<{ mass2: number[] }>();
  const man3 = new ComponentManager<{ mass3: number[] }>();
  const man4 = new ComponentManager<{ mass4: number[] }>();
  const eman = new EntityManager();
  registerComponentMan(eman, man1, man2, man3, man4);

  const e0 = createEntity(eman);
  const e1 = createEntity(eman);

  addComponent(man1, e0, { mass1: 1 });
  addComponent(man2, e0, { mass2: 2 });
  addComponent(man3, e0, { mass3: 3 });

  addComponent(man1, e1, { mass1: 1 });
  addComponent(man2, e1, { mass2: 2 });

  const q1 = new Query([man1, man2, man3]);
  const q2 = new Query([man1]);
  const q3 = new Query([man2, man3]);
  const q4 = new Query([man4]);

  expect(q1.entities.size).toBe(1);
  expect(q2.entities.size).toBe(2);
  expect(q3.entities.size).toBe(1);
  expect(q4.entities.size).toBe(0);

  const e2 = createEntity(eman);
  addComponent(man4, e2, { mass4: 4 });

  expect(q4.entities.size).toBe(1);

  removeComponent(man1, eman, e0);
  expect(q1.entities.size).toBe(0);
});

test('tags', () => {
  const tag1 = new ComponentManager();
});

test('one component managing multiple instances', () => {
  // multiple masses don't make sense but are easy to test
  const eman = new EntityManager();
  const man = new ComponentManager<{ mass: number[][] }>();
  const e0 = createEntity(eman);
  addComponent(man, e0, { mass: [1, 2] });
  expect(lookup(man, e0)).toMatchInlineSnapshot(`
    {
      "next": null,
      "prev": null,
      "storageIdx": 0,
    }
  `);
});

test('not query', () => {
  const eman = new EntityManager();
  const man1 = new ComponentManager<{ mass1: number[] }>();
  const man2 = new ComponentManager<{ mass2: number[] }>();

  const e0 = createEntity(eman);
  const e1 = createEntity(eman);

  addComponent(man1, e0, { mass1: 0 });
  addComponent(man1, e1, { mass1: 1 });

  addComponent(man2, e0, { mass2: 0 });

  const q1 = new Query([man1], [man2]);
  const q2 = new Query([man1, man2]);

  expect(q1.entities.has(e1)).toBeTruthy();
  expect(q2.entities.has(e0)).toBeTruthy();

  expect(q1.entities.size).toBe(1);
  expect(q2.entities.size).toBe(1);
});

test('handle is null when all components removed', () => {
  const eman = new EntityManager();
  const man1 = new ComponentManager<{ mass1: number[] }>();

  const e0 = createEntity(eman);
  addComponent(man1, e0, { mass1: 0 });
  removeComponent(man1, eman, e0);
  expect(lookup(man1, e0)).toBeNull();
});

test('handle is null when entity destroyed', () => {
  const eman = new EntityManager();
  const man1 = new ComponentManager<{ mass1: number[] }>();
  registerComponentMan(eman, man1);

  const e0 = createEntity(eman);
  addComponent(man1, e0, { mass1: 0 });
  destroyEntity(eman, e0);
  expect(lookup(man1, e0)).toBeNull();
});

test('borrowed is not destroyed', () => {
  const eman = new EntityManager();
  type Rocket = { fuel: number };

  const man1 = new ComponentManager<{ mass1: number[]; rocket: EntityId[] }>();
  const man2 = new ComponentManager<AsComponentData<Rocket>>();
  registerComponentMan(eman, man1, man2);

  const e0 = createEntity(eman);
  const e1 = createEntity(eman);
  addComponent(man1, e0, { mass1: 0, rocket: borrowEntityId(e1) });
  addComponent(man2, e1, { fuel: 100 });

  removeComponent(man1, eman, e0);

  const h = lookup(man2, e1);
  expect(h).toBeTruthy();
  if (!h) return;
  expect(man2.storage.fuel?.[h.storageIdx]).toBe(100);
});

test('owned is destroyed', () => {
  const eman = new EntityManager();
  type Rocket = { fuel: number };

  const man1 = new ComponentManager<{ mass1: number[]; rocket: EntityId[] }>();
  const man2 = new ComponentManager<AsComponentData<Rocket>>();
  registerComponentMan(eman, man1, man2);

  const e0 = createEntity(eman);
  const e1 = createEntity(eman);
  addComponent(man1, e0, { mass1: 0, rocket: e1 });
  addComponent(man2, e1, { fuel: 100 });

  removeComponent(man1, eman, e0);

  const h = lookup(man2, e1);
  expect(h).toBeFalsy();
  expect(man2.storage.fuel?.[h?.storageIdx ?? -1]).toBe(undefined);
});
