import { ROWS_SPRITE_OFFSET } from './constants';
import drawText from './draw-text';

export default function drawCustomers (interp, state) {
  const {
    customers,
  } = state;

  customers.forEach((customer, idx) => {

    // draw a customer and what they want

    const { type, name } = customer.wants;
    const { cols, rows } = customer.position;

    drawText(state,
      (customer.paid ? '' : '█ ') + customer.name + ': ' + name,
      cols, rows + ROWS_SPRITE_OFFSET);
  });
}