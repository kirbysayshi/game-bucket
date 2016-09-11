export default function (state, tileName, destCol, destRow) {

  const {
    SPRITE_SIZE,
    screen,
    tileMap,
    tileImage,
  } = state;

  const { scale } = screen;

  const tile = tileMap[tileName];
  screen.ctx.drawImage(tileImage,
    tile.x, tile.y, tile.w, tile.h,
    destCol * SPRITE_SIZE * scale, destRow * SPRITE_SIZE * scale,
    SPRITE_SIZE * scale, SPRITE_SIZE * scale
  );
}