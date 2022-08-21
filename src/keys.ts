// These keys must be quoted to force terser to keep these keys as is. It
// doesn't know they come from the DOM Keyboard API. Prettier wants to remove

import { listen } from './dom';

// Represent the physical key on the keyboard (position) instead of the character itself.
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
type Codes =
  | 'KeyW'
  | 'KeyA'
  | 'KeyS'
  | 'KeyD'
  | 'ArrowRight'
  | 'ArrowLeft'
  | 'ShiftLeft'
  | 'ShiftRight'
  | 'Enter';

// the quotes, so disable it.
const keyInputs: {
  [K in Codes]: boolean;
} = {
  // prettier-ignore
  'KeyW': false,
  // prettier-ignore
  'KeyA': false,
  // prettier-ignore
  'KeyS': false,
  // prettier-ignore
  'KeyD': false,
  // prettier-ignore
  'ArrowLeft': false,
  // prettier-ignore
  'ArrowRight': false,
  // prettier-ignore
  'ShiftLeft': false,
  // prettier-ignore
  'ShiftRight': false,
  // prettier-ignore
  'Enter': false,
};

listen(window, 'keydown', (ev) => {
  keyInputs[ev.code as Codes] = true;
});

listen(window, 'keyup', (ev) => {
  keyInputs[ev.code as Codes] = false;
});

export function useKeyInputs() {
  return keyInputs;
}
