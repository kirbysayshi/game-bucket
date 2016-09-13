export function stationInFrontOfPlayer (state) {
  // what station the player is in front of
  // what is the player holding
  const { player, } = state;
  const { position, } = state.player;
  const { entries, } = state.stations;
  const station = entries[position.rows];
  return station;
}