import { set, v2 } from 'pocket-physics';
import { SpatialHash } from './spatial-hash';

test('item1 is included in query, item2 is not', () => {
  const g = new SpatialHash(10);

  const item1 = {
    pos: v2(5, 5),
    wh: v2(10, 10),
  };

  const item2 = {
    pos: v2(15, 15),
    wh: v2(10, 10),
  };

  const h1 = g.add(item1.pos, item1.wh, item1);
  g.add(item2.pos, item2.wh, item2);
  const results = g.query(v2(0, 0), v2(10, 10));

  expect(results).toHaveLength(1);
  expect(results[0]).toBe(h1);
});

test('item1 is deleted and not found', () => {
  const g = new SpatialHash(10);

  const item1 = {
    pos: v2(5, 5),
    wh: v2(10, 10),
  };

  const item2 = {
    pos: v2(5, 5),
    wh: v2(10, 10),
  };

  const h1 = g.add(item1.pos, item1.wh, item1);
  const h2 = g.add(item2.pos, item2.wh, item2);
  g.delete(h1);

  const results = g.query(v2(0, 0), v2(10, 10));
  expect(results).toHaveLength(1);
  expect(results[0]).toBe(h2);
});

test('item is found after update', () => {
  const g = new SpatialHash(10);

  const item = {
    pos: v2(5, 5),
    wh: v2(10, 10),
  };

  const h = g.add(item.pos, item.wh, item);

  set(item.pos, 45, 45);
  g.update(item.pos, item.wh, h);

  const result1 = g.query(v2(0, 0), v2(10, 10));
  expect(result1).toHaveLength(0);

  const result2 = g.query(v2(22.5, 22.5), v2(45, 45));
  expect(result2).toHaveLength(1);
  expect(result2[0]).toBe(h);
});

test('must delete before re-add', () => {
  const g = new SpatialHash(10);

  const item1 = {
    pos: v2(5, 5),
    wh: v2(10, 10),
  };

  const h1 = g.add(item1.pos, item1.wh, item1);

  expect(() => {
    g.add(item1.pos, item1.wh, item1, h1);
  }).toThrow();
});
