import { clearScreen } from '../components/ViewportCmp';
import { CES3C } from '../initialize-ces';
import { assertDefinedFatal } from '../utils';

// clear the screen at 60fps
export const DrawClearScreenSystem = () => (ces: CES3C) => {
  const vp = ces.selectFirstData('viewport');
  assertDefinedFatal(vp);
  clearScreen(vp);
};
