export const qsel = document.querySelector.bind(document);
export const qsela = document.querySelectorAll.bind(document);

const ROOT_EL = qsel('#r');
const PRIMARY_CVS = qsel('#c');
const UI_ROOT = qsel('#u');

if (!ROOT_EL || !PRIMARY_CVS || !UI_ROOT) {
  throw new Error('Could not locate DOM!');
}

export function usePrimaryCanvas() {
  return PRIMARY_CVS! as HTMLCanvasElement;
}

export function useUIRoot() {
  return UI_ROOT! as HTMLDivElement;
}

export function useRootElement() {
  return ROOT_EL! as HTMLDivElement;
}

export function o_o(tagName: string, content: string) {
  const el = document.createElement(tagName);
  el.innerHTML = content;
  return el;
}

export function createTap(el: HTMLElement, cb: () => void) {
  const onMouseUp = (ev: MouseEvent) => {
    ev.preventDefault();
    cb();
  };
  const onTouchStart = (ev: TouchEvent) => {
    ev.preventDefault();
  };
  const onTouchEnd = (ev: TouchEvent) => {
    cb();
  };
  const un1 = listen(el, 'mouseup', onMouseUp);
  const un2 = listen(el, 'touchstart', onTouchStart);
  const un3 = listen(el, 'touchend', onTouchEnd);

  return () => {
    un1();
    un2();
    un3();
  };
}

// https://github.com/microsoft/TypeScript/issues/33047#issuecomment-524317113
// Sometimes typescript makes things so hard...
type EventMap<T> = T extends Window
  ? WindowEventMap
  : T extends Document
  ? DocumentEventMap
  : T extends HTMLElement
  ? HTMLElementEventMap
  : { [key: string]: Event };

export function listen<
  T extends EventTarget,
  K extends keyof EventMap<T> & string
>(
  target: T,
  type: K,
  callback: (this: T, ev: EventMap<T>[K]) => any,
  options?: AddEventListenerOptions
) {
  target.addEventListener(type, callback as EventListener, options);
  return () => {
    target.removeEventListener(type, callback as EventListener, options);
  };
}

export function isLikelyTouchDevice() {
  return matchMedia('(hover: none)').matches;
}
