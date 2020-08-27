import { useSeedValue } from "./query-string";

// function tetris() {
//   var value = 0x8988;
//   return function() {
//     var bit1 = (value >> 1) & 1;
//     var bit9 = (value >> 9) & 1;
//     var leftmostBit = bit1 ^ bit9;
//     return (value = ((leftmostBit << 15) | (value >>> 1)) >>> 0);
//   };
// }

// function rngFloat(rng: ReturnType<typeof tetris>) {
//   return () => {
//     const v = (rng() - 2) / (65534 - 2);
//     return v;
//   };
// }

// const randGen = rngFloat(tetris());
// export function useRandom() {
//   return randGen();
// }

// https://gist.github.com/blixt/f17b47c62508be59987b#gistcomment-2792771

// Mulberry32, a fast high quality PRNG: https://gist.github.com/tommyettinger/46a874533244883189143505d203312c
var mb32 = (s: number) => (t?: number) =>
  ((s = (s + 1831565813) | 0),
  (t = Math.imul(s ^ (s >>> 15), 1 | s)),
  (t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t),
  (t ^ (t >>> 14)) >>> 0) /
  2 ** 32;

// Better 32-bit integer hash function: https://burtleburtle.net/bob/hash/integer.html
var hash = (n: number) =>
  ((n = 61 ^ n ^ (n >>> 16)),
  (n += n << 3),
  (n = Math.imul(n, 668265261)),
  (n ^= n >>> 15)) >>> 0;

const param = useSeedValue();
const seed = param ? Number(param) : Date.now();
const gen = mb32(hash(seed));
export const useRandom = () => gen();
