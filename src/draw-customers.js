import { ROWS_SPRITE_OFFSET } from './constants';
import drawText from './draw-text';

export default function drawCustomers (interp, state) {
  const {
    customers,
    SPRITE_COLS,
  } = state;

  const labelRows = 0.5;

  drawText(state,
    'CUSTOMERS', Math.floor(SPRITE_COLS / 2), labelRows + ROWS_SPRITE_OFFSET);

  customers.forEach((customer, idx) => {

    // draw a customer and what they want

    const { type, name } = customer.wants;
    const { cols, rows } = customer.position;

    drawText(state,
      (customer.paid ? '' : '█ ') + customer.name + ': ' + name,
      cols, labelRows + rows + ROWS_SPRITE_OFFSET);
  });
}