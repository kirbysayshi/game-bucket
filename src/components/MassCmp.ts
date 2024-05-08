export type MassCmp = { k: 'p-mass'; mass: number };

export function makeMassCmp(mass: number): MassCmp {
  return {
    k: 'p-mass',
    mass,
  };
}
