const fs = require('fs');

const inputPath = process.argv[2];
const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const outputPath = process.argv[3];

const output = {};

if (!input.frames) {
  console.error('Warning: ' + inputPath + ' JSON appears to be already optimized!');
  process.exit();
}

Object.keys(input.frames).forEach(key => {
  const data = input.frames[key];
  // delete data.rotated;
  // delete data.trimmed;
  // delete data.spriteSourceSize;
  // delete data.sourceSize;

  output[key] = data.frame;
});

fs.writeFileSync(outputPath, JSON.stringify(output, null, '  '));


// "sourceSize": {"w":4,"h":8}
// },
// "~":
// {
// 	"frame": {"x":18,"y":0,"w":6,"h":3},
// 	"rotated": false,
// 	"trimmed": false,
// 	"spriteSourceSize": {"x":0,"y":0,"w":6,"h":3},
// 	"sourceSize": {"w":6,"h":3}
// }},
// "meta": {
// 	"app": "https://www.codeandweb.com/texturepacker",
// 	"version": "1.0",
// 	"image": "sprites-hash.png",
// 	"format": "RGBA8888",
// 	"size": {"w":128,"h":220},
// 	"scale": "1",
// 	"smartupdate": "$TexturePacker:SmartUpdate:624903d89b5d2a4bf5a7fc79386b03af:e89517581fabfe8a411908f987d3cd82:a4f9a4ef733ee38073abf56b7a301632$"
// }
// }



