export default function (state, value, max, col, row) {

  const { SPRITE_SIZE, screen, } = state;
  const { scale } = screen;

  const cellWidth = SPRITE_SIZE * scale; // also height
  const barHeight = cellWidth / 3;
  const yOffset = cellWidth - barHeight
  const barWidth = (value / max) * cellWidth;

  screen.ctx.fillStyle = 'rgba(255,255,255,0.8)';
  screen.ctx.fillRect(
    col * SPRITE_SIZE * scale, (row * SPRITE_SIZE * scale) + yOffset,
    barWidth, barHeight
  );
}