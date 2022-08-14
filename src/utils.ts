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
