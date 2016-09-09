export default function drawPlayer (interp, state) {
  const {
    screen,
    player,
    SPRITE_SIZE,
  } = state;

  const { offset } = player;
  const { cols, rows } = player.position;
  screen.ctx.fillStyle = 'white';
  screen.ctx.fillRect(
    (offset.cols + cols) * SPRITE_SIZE,
    (offset.rows + rows) * SPRITE_SIZE,
    SPRITE_SIZE, SPRITE_SIZE
  );
}