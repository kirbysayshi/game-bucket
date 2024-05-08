import { CES3 } from './ces3';
import { Component } from './components';

// This is a separate file to avoid CES3 directly depending on Component and
// vice versa.

export type CES3C = CES3<Component>;


export function initializeCES(): CES3C {
  return new CES3<Component>();
}
