import { CES4 } from './ces4';
import { Component } from './components';
const ces = new CES4<Component>();

export function useCES() {
  return ces;
}
