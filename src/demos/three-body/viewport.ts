import { deriveViewportCmp } from '../../components/ViewportCmp';

export class ViewportMan {
  v = deriveViewportCmp();

  constructor(getRootElement: () => HTMLElement) {
    this.v = deriveViewportCmp();
    window.addEventListener('resize', () =>
      computeWindowResize(getRootElement),
    );
    computeWindowResize(getRootElement);
  }
}

function computeWindowResize(getRootElement: () => HTMLElement) {
  const cmp = deriveViewportCmp();

  // TODO: consider hand-rolling a ctx.save/restore that only manages the
  // transform using .getTransform and .setTransform. Lots of perf time taken up
  // by .save/restore() currently.

  const root = getRootElement();
  root.style.width = cmp.width + 'px';

  const toPx = (n: number) =>
    Math.floor((n / cmp.vpWidth) * cmp.dprCanvas.width);
  cmp.dprCanvas.ctx.translate(
    toPx(cmp.camera.frustrum.x),
    toPx(cmp.camera.frustrum.y),
  );
  // Force +y to be UP. Remember to reverse when writing text or image!
  // https://usefulangle.com/post/18/javascript-html5-canvas-solving-problem-of-inverted-text-when-y-axis-flipped
  cmp.dprCanvas.ctx.scale(1, -1);
}
