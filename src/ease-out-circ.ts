// t: current time (ticks, seconds, whatever),
// b: begInnIng value,
// c: total change In value,
// d: total duration of easing (ticks, seconds, whatever)
export function easeOutCirc (t: number, b: number, c: number, d: number) {
  return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
}