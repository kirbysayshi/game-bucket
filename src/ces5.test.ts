import { v2 } from 'pocket-physics';
import { EntityManager, PointMassComponentMan, lookup } from './ces5';

test('entity create', async () => {
  const eman = new EntityManager();
  expect(() => {
    while (true) {
      eman.create();
    }
  }).toThrowErrorMatchingInlineSnapshot(`"expected true, got false: 4194304"`);
});

test('cpos', () => {
  const eman = new EntityManager();
  const pointman = new PointMassComponentMan();

  const e0 = eman.create();

  pointman.add({
    entity: e0,
    acel: v2(),
    ppos: v2(),
    cpos: v2(),
    mass: 0,
  });

  pointman.add({
    entity: e0,
    acel: v2(),
    ppos: v2(),
    cpos: v2(),
    mass: 1,
  });

  pointman.add({
    entity: e0,
    acel: v2(),
    ppos: v2(),
    cpos: v2(),
    mass: 2,
  });

  const e1 = eman.create();
  pointman.add({
    entity: e1,
    acel: v2(1, 1),
    ppos: v2(1, 1),
    cpos: v2(1, 1),
    mass: 1,
  });

  const h = lookup(pointman, e0);
  expect(h).toBeTruthy();
  if (!h) return;

  pointman.setCpos(h, v2(1, 1));
  expect(pointman.cpos(h)).toStrictEqual(v2(1, 1));

  console.dir(pointman, { depth: 999 });

  pointman.remove(e0);

  console.dir(pointman, { depth: 999 });
});
