/**
 * Useful in dev for avoiding usage of the ! operator. Will be removed by rollup
 * before compression.
 */
export function assertDefinedFatal<T>(
  value: T | null | undefined,
  context = ''
): asserts value is T {
  if (value == null || value === undefined) {
    throw new Error(
      `Fatal error: value ${value} ${
        context ? `(${context})` : ''
      } must not be null/undefined.`
    );
  }
}

export const assertExhaustive = (_n: never): void => {
  throw new Error('Unreachable');
};