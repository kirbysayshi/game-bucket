export default function (state, tileName, destCol, destRow) {

  const {
    SPRITE_SIZE,
    screen,
    tileSet,
    tileImage,
  } = state;

  const { scale } = screen;

  const tile = tileSet[tileName];
  screen.ctx.drawImage(tileImage,
    tile.x, tile.y, tile.w, tile.h,
    destCol * SPRITE_SIZE * scale, destRow * SPRITE_SIZE * scale,
    SPRITE_SIZE * scale, SPRITE_SIZE * scale
  );
}