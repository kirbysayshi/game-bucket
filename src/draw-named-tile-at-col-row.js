export default function (state, tileName, destCol, destRow) {

  const {
    SPRITE_SIZE,
    screen,
    tileMap,
    tileImage,
  } = state;

  const tile = tileMap[tileName];
  screen.ctx.drawImage(tileImage,
    tile.x, tile.y, tile.w, tile.h,
    destCol * SPRITE_SIZE, destRow * SPRITE_SIZE,
    SPRITE_SIZE, SPRITE_SIZE
  );
}