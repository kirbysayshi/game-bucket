// t: current time (ticks, seconds, whatever),
// b: begInnIng value,
// c: total change In value,
// d: total duration of easing (ticks, seconds, whatever)
export function easeInExpo (t, b, c, d) {
  return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
}