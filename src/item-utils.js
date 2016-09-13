import {
  CLEAN_PORTAFILTER,
  FILLED_PORTAFILTER,
} from './constants';

export function takeItemOfType (taker, giver, type) {
  const idx = giver.has.findIndex(item => item.type === type);
  if (idx === -1) return;
  const item = giver.has.splice(idx, 1);
  taker.has.push(item[0]);
  taker.has.sort(defaultItemSort);
}

export function addItemOfType (taker, type, sprite) {
  const item = { type, sprite: sprite || type };
  taker.has.push(item);
  taker.has.sort(defaultItemSort);
  return item;
}

export function hasItemOfType (giver, type) {
  return giver.has.find(item => item.type === type);
}

export function removeItemOfType (giver, type) {
  const idx = giver.has.findIndex(item => item.type === type);
  if (idx === -1) return;
  return giver.has.splice(idx, 1)[0];
}

export function emptyItems (giver) {
  giver.has.length = 0;
}

export function firstItemType(giver) {
  return giver.has[0].type;
}

export function hasWhichItem(giver, types) {
  for (let i = 0; i < types.length; i++) {
    if (giver.has.find(item => item.type === types[i])) {
      return types[i];
    }
  }
  return false;
}

export function defaultItemSort (a, b) {
  // Always attempt to sort the portafilter higher in the array,
  // since later things are drawn last.
  if (a.type === CLEAN_PORTAFILTER
    || a.type === FILLED_PORTAFILTER
  ) return 1;

  if (b.type === CLEAN_PORTAFILTER
    || b.type === FILLED_PORTAFILTER
  ) return -1;

  return 0;
}