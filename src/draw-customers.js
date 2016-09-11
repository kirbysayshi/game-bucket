//import { PICKUP_COUNTER } from './constants';
import drawText from './draw-text';

export default function drawCustomers (interp, state) {
  const {
    customers,
  } = state;

  customers.forEach((customer, idx) => {

    // draw a customer and what they want

    const { type } = customer.wants;
    const { cols, rows } = customer.position;

    drawText(state, customer.name + ': ' + type, cols, rows);
  });
}