export function tetris () {
  var value = 0x8988;
  return function() {
    var bit1 = (value >> 1) & 1;
    var bit9 = (value >> 9) & 1;
    var leftmostBit = bit1 ^ bit9;
    return (value = ((leftmostBit << 15) | (value >>> 1)) >>> 0);
  }
}

export function rngFloat (rng) {
  return () => {
    return rng() / 65534;
  }
}
