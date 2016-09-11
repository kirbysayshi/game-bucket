import {
  FONT_COLOR_WHITE,
  FONT_COLOR_BLACK,
} from './constants';

export default function drawText (state, str, col, row, color=FONT_COLOR_WHITE) {
  const {
    SPRITE_SIZE,

    fontChrWidths,
    fontChrOrder,
    fontImageWhite,
    fontImageBlack,
    screen,
  } = state;

  // Might need some other colors here, eventually.
  const fontImage = color === FONT_COLOR_WHITE
    ? fontImageWhite
    : fontImageBlack;

  const chrToWidth = Object.keys(fontChrWidths).reduce((all, width) => {
    fontChrWidths[width].split('').forEach(l => all[l] = parseInt(width, 10));
    return all;
  }, {});

  let x = SPRITE_SIZE * col;
  let y = SPRITE_SIZE * row;

  str.split('').forEach(c => {

    // determine where in the sheet
    let sheetX = 0;

    for (let i = 0; i < fontChrOrder.length; i++) {
      const orderChr = fontChrOrder[i];
      if (c === orderChr) break;
      sheetX += chrToWidth[orderChr];
    }

    if (c !== ' ') {
      // draw to accumulated position on screen
      screen.ctx.drawImage(fontImage,
        sheetX, 0, chrToWidth[c], fontImage.height,
        x, y, chrToWidth[c], fontImage.height
      );
    }

    // For next char
    x += chrToWidth[c];
  })
}