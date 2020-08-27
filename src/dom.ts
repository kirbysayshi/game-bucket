const qsel = document.querySelector.bind(document);

const ROOT_EL = qsel("#r");
const PRIMARY_CVS = qsel("#c");
const UI_ROOT = qsel("#u");

if (!ROOT_EL || !PRIMARY_CVS || !UI_ROOT) {
  throw new Error("Could not locate DOM!");
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
  const un1 = listen(el, "mouseup", onMouseUp);
  const un2 = listen(el, "touchstart", onTouchStart);
  const un3 = listen(el, "touchend", onTouchEnd);

  return () => {
    un1();
    un2();
    un3();
  };
}

type Unlistener = () => void;

export function listen<K extends keyof HTMLElementEventMap>(
  el: HTMLElement,
  ev: K,
  handler: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any
): Unlistener {
  el.addEventListener(ev, handler, false);
  return () => {
    el.removeEventListener(ev, handler, false);
  };
}
