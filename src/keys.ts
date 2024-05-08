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
  | 'Enter'
  | 'Digit1'
  | 'Digit2'
  | 'Digit3'
  | 'Digit4'
  | 'Digit5'
  | 'Digit6'
  | 'Digit7';

type KeyDownState = {
  [K in Codes]?: boolean;
};

const keyInputs: KeyDownState = {};

listen(window, 'keydown', (ev) => {
  keyInputs[ev.code as Codes] = true;
});

listen(window, 'keyup', (ev) => {
  keyInputs[ev.code as Codes] = false;
});

export function getKeyInputs() {
  return keyInputs;
}
