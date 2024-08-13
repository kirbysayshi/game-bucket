import { asPixels as asP, asWorldUnits as asW, Camera2D } from './Camera2d';

test('rotation', () => {
  const c = new Camera2D(asW(50), asW(50));
  // rotate counterclockwise 90deg
  c.rotate(asW(Math.PI / 2));
  // move to the camera's right...
  c.move(asW(0), asW(1));
  expect(c.screenToWorld(asP(0), asP(0), asP(100), asP(100))).toEqual({
    x: 25,
    y: -24,
  });
});
