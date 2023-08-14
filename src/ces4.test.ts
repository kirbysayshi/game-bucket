/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  AssuredBorrowedEntityId,
  AssuredEntityId,
  borrowAssuredEntityId,
  CES4,
  narrowAssuredEntityId,
} from './ces4';

type C1 = {
  k: 'c1';
  p1: number;
};

type C2 = {
  k: 'c2';
  p2: string;
};

type C3 = {
  k: 'c3';
  a: AssuredEntityId<C1>;
  b: AssuredBorrowedEntityId<C2>;
};

// https://2ality.com/2019/07/testing-static-types.html
type AssertIs<T, Expected> = T extends Expected
  ? Expected extends T
    ? true
    : never
  : never;

test('ces entity id types', () => {
  const ces = new CES4<C1 | C2>();

  const id = ces.entity([
    { k: 'c1', p1: 23 },
    { k: 'c2', p2: 'hello' },
  ]);

  const t1: AssertIs<typeof id, AssuredEntityId<C1 | C2>> = true;
  expect(t1).toBe(true);

  const id2 = ces.entity([{ k: 'c2', p2: 'hello' }]);

  const t2: AssertIs<typeof id2, AssuredEntityId<C2>> = true;
  expect(t2).toBe(true);

  const q = ces.createQuery(['c1']);
  ces.select(q).forEach((result) => {
    const t3: AssertIs<typeof result, AssuredEntityId<C1>> = true;
    expect(t3).toBe(true);
    const d = ces.data(result, 'c1');
    const t4: AssertIs<typeof d, C1> = true;
    expect(t4).toBe(true);
    expect(typeof result.id).toBe('number');
  });

  const firstC1 = ces.selectFirstData('c1');
  const t5: AssertIs<typeof firstC1, C1> = true;
  expect(t5).toBe(true);

  const id22 = ces.add(id2, { k: 'c1', p1: 23 });
  const t6: AssertIs<typeof id22, AssuredEntityId<C1 | C2>> = true;
  expect(t6).toBe(true);

  const dg = narrowAssuredEntityId(id, 'c2');
  const t7: AssertIs<typeof dg, AssuredEntityId<C2>> = true;
  expect(t7).toBe(true);
});

test('ces4 entity creation does not require expansion', () => {
  const ces = new CES4<C1 | C2>();

  const e0 = ces.entity([{ k: 'c1', p1: 0 }]);
  const e1 = ces.entity([{ k: 'c1', p1: 1 }]);
  const e2 = ces.entity([{ k: 'c1', p1: 2 }]);
  const e3 = ces.entity([{ k: 'c1', p1: 3 }]);
  const e4 = ces.entity([{ k: 'c1', p1: 4 }]);

  expect(e0.id).toBe(0);
  expect(e1.id).toBe(1);
  expect(e2.id).toBe(2);
  expect(e3.id).toBe(3);
  expect(e4.id).toBe(4);

  ces.destroy(e1);
  ces.flushDestruction();

  const e5 = ces.entity([{ k: 'c1', p1: 5 }]);
  const e6 = ces.entity([{ k: 'c1', p1: 6 }]);

  // expect(e5.id).toBe(1); // e5 reuses id 1
  // expect(e6.id).toBe(5); // e6 uses newly allocated

  expect(ces.data(e0, 'c1')).toStrictEqual({ k: 'c1', p1: 0 });
  expect(ces.data(e5, 'c1')).toStrictEqual({ k: 'c1', p1: 5 });
});

test('ces4 recursive deletion', () => {
  const ces = new CES4<C1 | C2 | C3>();

  const e0 = ces.entity([{ k: 'c1', p1: 0 }]);
  const e1 = ces.entity([{ k: 'c2', p2: 'x' }]);

  // @ts-expect-error e1 as EntityId is not assignable to BorrowedEntityId
  ces.entity([{ k: 'c3', a: e0, b: e1 }]);

  const e3 = ces.entity([{ k: 'c3', a: e0, b: borrowAssuredEntityId(e1) }]);

  expect(e3.id).toBe(3);
  ces.destroy(e3);
  expect(e3.destroyed).toBe(true);
  ces.flushDestruction();
  expect(ces.has(e3, 'c3')).toBe(false);
  expect(ces.isDestroyed(e3)).toBe(true);
  expect(ces.data(e0, 'c1')).toBe(undefined);
  expect(ces.isDestroyed(e1)).toBe(false);
});
