import { Vector2 } from 'pocket-physics';
import { ViewportUnits } from './components/ViewportCmp';

type HashId = string & { __isHashId: true };

function hashIdFromUnits(
  x: ViewportUnits,
  y: ViewportUnits,
  cellSize: ViewportUnits
): HashId {
  return `${Math.floor(x / cellSize)}-${Math.floor(y / cellSize)}` as HashId;
}

function hashIdFromCellIndices(x: number, y: number) {
  // .floor is unnecessary, but just in case.
  return `${Math.floor(x)}-${Math.floor(y)}` as HashId;
}

function toCellIndex(n: number, cellSize: number) {
  // can be negative!
  return Math.floor(n / cellSize);
}

/**
 * The external interface to the spatial hash.
 */
export interface SpatialHandleExt<T> {
  item: T;
}

/**
 * The internal interface to the spatial hash. This is the same instance as the
 * external interface, but it discourages reading the values.
 */
interface SpatialHandleInt<T> {
  item: T;
  // Cells the item is within, only for deletion
  cells: HashId[];
  // Compare these during an update. If they change, the item must be reinserted.
  bottomLeft: HashId;
  upperRight: HashId;
  // Internal Only: since a query is synchronous, we can use this
  queryId: number;
}

/**
 * Easily convert between types.
 */
function assertSpatialHandleIsInternal<T>(
  h: SpatialHandleExt<T> | SpatialHandleInt<T>
): asserts h is SpatialHandleInt<T> {
  if (!h.item) throw new Error('Not a SpatialHandle!');
}

function SpatialHandleReset<T>(
  h: SpatialHandleExt<T> | SpatialHandleInt<T>,
  bottomLeft: HashId,
  upperRight: HashId
) {
  assertSpatialHandleIsInternal(h);
  h.bottomLeft = bottomLeft;
  h.upperRight = upperRight;
  h.queryId = -1;
  h.cells.length = 0;
  return h;
}

function SpatialHandleCreate<T>(
  item: T,
  bottomLeft: HashId,
  upperRight: HashId,
  cells: HashId[] = []
): SpatialHandleInt<T> {
  return {
    item,
    cells,
    bottomLeft,
    upperRight,
    queryId: -1,
  };
}

function cellBounds<U extends Vector2>(pos: U, wh: U, cellSize: number) {
  const halfW = wh.x / 2;
  const halfH = wh.y / 2;
  const xstart = toCellIndex(pos.x - halfW, cellSize);
  const xend = toCellIndex(pos.x + halfW, cellSize);
  const ystart = toCellIndex(pos.y - halfH, cellSize);
  const yend = toCellIndex(pos.y + halfH, cellSize);
  return { xstart, xend, ystart, yend };
}

/**
 * A spatial grid / spatial hash, of infinite size. It uses a Map() under the
 * hood, so only buckets/cells that are occupied take up memory, negative
 * positions are allowed, and no mathmatical hashing is actually needed at this
 * level.
 *
 * It's best to choose a cell size that is about 2x as large as your
 * common-sized objects. Add/update AABBs to the spatial grid, then query for
 * those occupying an arbitrary area.
 */
export class SpatialHash<T, U extends Vector2> {
  // A Set generally appears to be faster than an array:
  // https://jsbench.me/zfl7ogu64g
  // https://jsbench.me/1al7oha7ln
  private buckets = new Map<HashId, Set<SpatialHandleInt<T>>>();
  private queryId = -1;

  /**
   *
   * @param cellSize The width and height of each square cell that the "world"
   * will be divided into. It's best to choose a cellSize that is about 2x the
   * size of the majority of your objects. The cells are not literal, they are
   * mathematical: a cell is really just a bucket location derived by grouping
   * similar positions. The grouping is the cellSize.
   */
  constructor(private cellSize: U['x']) {}

  add(
    pos: U,
    wh: U,
    item: T,
    reuseHandle?: SpatialHandleExt<T>
  ): SpatialHandleExt<T> {
    const { xstart, xend, ystart, yend } = cellBounds(pos, wh, this.cellSize);
    const bottomLeft = hashIdFromCellIndices(xstart, ystart);
    const upperRight = hashIdFromCellIndices(xend, yend);

    const handle = reuseHandle
      ? SpatialHandleReset(reuseHandle, bottomLeft, upperRight)
      : SpatialHandleCreate(item, bottomLeft, upperRight);

    for (let x = xstart; x <= xend; x++) {
      for (let y = ystart; y <= yend; y++) {
        const hashId = hashIdFromCellIndices(x, y);
        const bucket = this.buckets.get(hashId) ?? new Set();
        this.buckets.set(hashId, bucket);
        if (process.env.NODE_ENV !== 'production') {
          const found = bucket.has(handle);
          if (found) {
            throw new Error(
              `Found pre-existing SpatialHandle during add operation. Must delete first.`
            );
          }
        }
        bucket.add(handle);
        handle.cells.push(hashId);
      }
    }

    return handle;
  }

  delete(handle: SpatialHandleExt<T>) {
    assertSpatialHandleIsInternal(handle);
    // Remove item from all cells
    for (const hashId of handle.cells) {
      const bucket = this.buckets.get(hashId);
      if (!bucket) continue;
      bucket.delete(handle);

      // TODO: This might cause unnecessary GC. Might be better to just leave the bucket there.
      // No more items? delete the entire bucket+key
      // if (bucket.size === 0) this.buckets.delete(hashId);
    }
  }

  update(pos: U, wh: U, handle: SpatialHandleExt<T>): SpatialHandleExt<T> {
    assertSpatialHandleIsInternal(handle);
    const { xstart, xend, ystart, yend } = cellBounds(pos, wh, this.cellSize);
    const bottomLeft = hashIdFromCellIndices(xstart, ystart);
    const upperRight = hashIdFromCellIndices(xend, yend);

    if (bottomLeft === handle.bottomLeft && upperRight === handle.upperRight)
      return handle;

    this.delete(handle);
    return this.add(pos, wh, handle.item, handle);
  }

  /**
   *
   * @param pos The center of the query
   * @param wh The dimensions (bounding box) of the query
   * @param results Optional, allows reusing an array of previous results to
   * avoid GC
   */
  query(
    pos: U,
    wh: U,
    results: SpatialHandleExt<T>[] = []
  ): SpatialHandleExt<T>[] {
    const { xstart, xend, ystart, yend } = cellBounds(pos, wh, this.cellSize);

    const thisQueryId = ++this.queryId;

    results.length = 0;

    for (let x = xstart; x <= xend; x++) {
      for (let y = ystart; y <= yend; y++) {
        const hashId = hashIdFromCellIndices(x, y);
        const bucket = this.buckets.get(hashId);
        if (!bucket) continue;

        for (const h of bucket) {
          // We mutate the queryId per query. If they match, we know that we
          // have already seen this handle in a previous cell, and therefore do
          // not add it to the list of results more than once. This avoids
          // needing a `Set`, which can be slower and causes more GC.
          if (h.queryId === thisQueryId) continue;
          h.queryId = thisQueryId;
          results.push(h);
        }
      }
    }

    return results;
  }
}
