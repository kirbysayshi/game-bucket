import ScienceHalt from 'science-halt';
import { createGameLoop } from '../../loop';
import {
  asPixels,
  asWorldUnits,
  Camera2D,
  drawCameraText,
  drawWorldText,
} from '../shared/Camera2d';
import { makeDPRCanvas } from '../../canvas';
import { usePrimaryCanvas } from '../../dom';
import { v2 } from 'pocket-physics';

let app: App | null = null;

export async function boot() {
  app = new App();
  app.boot();
}

export async function shutdown() {
  app?.destroy();
}

class App {
  stop = () => {};
  eventsOff = new AbortController();

  dprCanvas = makeDPRCanvas(400, 400, usePrimaryCanvas());
  camera = new Camera2D(asWorldUnits(100), asWorldUnits(100));

  constructor() {}

  async boot() {
    const { stop } = createGameLoop({
      drawTime: 1000 / 60,
      updateTime: 1000 / 60,
      update: (dt) => {},
      draw: (interp) => {
        const rect1 = { x: 0, y: 0, width: 10, height: 5 };
        const rect2 = { x: -30, y: -30, width: 20, height: 20 };

        // clear screen
        this.dprCanvas.ctx.clearRect(
          0,
          0,
          this.dprCanvas.cvs.width,
          this.dprCanvas.cvs.height,
        );

        // draw
        this.dprCanvas.ctx.save();

        // transform the context into world space
        this.camera.applyToContext(
          this.dprCanvas.ctx,
          asPixels(this.dprCanvas.width),
          asPixels(this.dprCanvas.height),
        );

        this.dprCanvas.ctx.fillStyle = 'red';
        this.dprCanvas.ctx.fillRect(
          rect1.x,
          rect1.y,
          rect1.width,
          rect1.height,
        );
        this.dprCanvas.ctx.fillStyle = 'blue';
        this.dprCanvas.ctx.fillRect(
          rect2.x,
          rect2.y,
          rect2.width,
          rect2.height,
        );

        drawWorldText(
          this.dprCanvas.ctx,
          this.camera,
          asPixels(this.dprCanvas.height),
          'World Space Text',
          asWorldUnits(30),
          asWorldUnits(10),
          2,
          (ctx, fontSizePx) => {
            ctx.font = `${fontSizePx}px sans-serif`;
            ctx.fillStyle = 'black';
          },
        );

        drawCameraText(
          this.dprCanvas.ctx,
          this.camera,
          asPixels(this.dprCanvas.height),
          'Screen Space Text',
          asPixels(0),
          asPixels(0),
          20,
          (ctx, fontSizePx) => {
            ctx.font = `${fontSizePx}px sans-serif`;
            ctx.fillStyle = 'black';
          },
        );

        this.dprCanvas.ctx.restore();
      },
    });
    this.stop = stop;

    if (process.env.NODE_ENV !== 'production') {
      ScienceHalt(() => this.destroy());
    }

    addEventListener(
      'keydown',
      (ev) => {
        if (ev.key === 'ArrowRight') {
          this.camera.move(asWorldUnits(1), asWorldUnits(0));
        } else if (ev.key === 'ArrowLeft') {
          this.camera.move(asWorldUnits(-1), asWorldUnits(0));
        } else if (ev.key === 'ArrowUp') {
          this.camera.move(asWorldUnits(0), asWorldUnits(-1));
        } else if (ev.key === 'ArrowDown') {
          this.camera.move(asWorldUnits(0), asWorldUnits(1));
        } else if (ev.key === 'q') {
          this.camera.rotate(asWorldUnits(Math.PI / 16));
        } else if (ev.key === 'e') {
          this.camera.rotate(asWorldUnits(-Math.PI / 16));
        }
      },
      { signal: this.eventsOff.signal },
    );
  }

  async destroy() {
    this.stop();
  }
}
