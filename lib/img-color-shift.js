export default function imgColorShift (img, r, g, b, a) {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, c.width, c.height);
  const data = imgData.data;
  for (var i = 0; i < data.length; i+=4) {
    data[i+0] = r; //| data[i+0];
    data[i+1] = g; //| data[i+1];
    data[i+2] = b; //| data[i+2];
    data[i+3] = data[i+3] !== 0 ? a : 0; //| data[i+3];
  }
  ctx.putImageData(imgData, 0, 0);
  return c;
}