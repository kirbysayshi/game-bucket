import { CES3 } from './ces3';
import { Component } from './components';
const ces = new CES3<Component>();

export function useCES() {
  return ces;
}
