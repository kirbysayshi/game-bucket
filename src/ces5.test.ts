import { v2 } from 'pocket-physics';
import {
  EntityManager,
  PointMassComponentMan,
  addComponent,
  lookup,
  removeComponent,
} from './ces5';

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

  const e1 = eman.create();
  addComponent(pointman, e1, {
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

  removeComponent(pointman, e0);

  console.dir(pointman, { depth: 999 });
});
