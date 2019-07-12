declare module '*.png';

declare module 'science-halt' {
  function scienceHalt (onhalt: () => void, opt_msg?: string, opt_keycode?: number): void;
  export = scienceHalt;
}

type Ms = number;

declare module 'pocket-physics/accelerate2d' {
  type V2 = { x: number; y: number; };
  function accelerate2d (cmp: { cpos: V2, acel: V2 }, dt: number): void;
  export = accelerate2d;
}

declare module 'pocket-physics/inertia2d' {
  type V2 = { x: number; y: number; };
  function inertia2d (cmp: { cpos: V2, ppos: V2 }): void;
  export = inertia2d;
}