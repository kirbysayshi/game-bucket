export function tetris () {
  var value = 0x8988;
  return function() {
    var bit1 = (value >> 1) & 1;
    var bit9 = (value >> 9) & 1;
    var leftmostBit = bit1 ^ bit9;
    return (value = ((leftmostBit << 15) | (value >>> 1)) >>> 0);
  }
}

export function rngFloat (rng: ReturnType<typeof tetris>) {
  return () => {
    const v = (rng() - 2) / (65534 - 2);
    return v;
  }
}
