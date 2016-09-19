// t: current time (ticks, seconds, whatever),
// b: begInnIng value,
// c: total change In value,
// d: total duration of easing (ticks, seconds, whatever)
export function easeInCirc (t, b, c, d) {
  return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
}