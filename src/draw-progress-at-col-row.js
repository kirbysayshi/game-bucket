export default function (state, value, max, col, row, greenMin, redMin) {

  const { SPRITE_SIZE, screen, } = state;
  const { scale } = screen;

  const cellWidth = SPRITE_SIZE * scale; // also height
  const barHeight = cellWidth / 3;
  const yOffset = cellWidth - barHeight
  const progress = (value / max);
  const barWidth = progress * cellWidth;

  const fillStyle = progress < greenMin
    ? 'rgba(255,255,255,0.8)'
    : progress >= greenMin && progress <= redMin
      ? 'rgba(0,255,0,0.8)'
      : 'rgba(255,0,0,0.8)';

  screen.ctx.fillStyle = fillStyle;
  screen.ctx.fillRect(
    col * SPRITE_SIZE * scale, (row * SPRITE_SIZE * scale) + yOffset,
    barWidth, barHeight
  );
}