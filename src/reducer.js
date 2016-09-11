export default function reducer (state, action) {
  
  // TODO: figure out some sort of immutability helper. maybe just ... ?

  if (action.type === 'DEBUG_TOGGLE') {
    state.debug = !state.debug;
  }

  if (action.type === 'NEW_CUSTOMER') {
    const { SPRITE_COLS } = state;
    state.customers.push({
      name: action.data.name,
      wants: action.data.wants,
      // TODO: compute all customers positions when a new one comes in
      position: { rows: state.customers.length, cols: Math.floor(SPRITE_COLS / 2) },
    });
  }
  
  if (action.type === 'SWIPE_UP') {
    const row = state.player.position.rows -= 1;
    if (row < 0) {
      state.player.position.rows = 0;
    }
  }
  
  if (action.type === 'SWIPE_DOWN') {
    const row = state.player.position.rows += 1;
    if (row > state.player.field.rows) {
      state.player.position.rows = state.player.field.rows;
    }
  }
  
  return state;
}