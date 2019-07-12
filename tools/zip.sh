#!/bin/bash

set -x
set -e

# not type checking, because...
# yarn check

yarn clean

# build
NODE_ENV=production yarn build

# compress JS
terser dist/bundle.js --compress --mangle -o dist/bundle.min.js
mv -f dist/bundle.min.js dist/bundle.js

# Optimize assets copied by rollup
find dist/ -iname '*.png' -exec ./tools/tinypng.sh {} {} \;
# optimize texture-packed json, if applicable
# node tools/shrink-texture-packer-json.js ./assets/sprites.json ./assets/sprites.json

# Create the zip
pushd dist/ 
zip -X -r game.zip index.html *.png *.svg *.bmp *.js
popd

# Optimize the zip
if ! [ -x "$(command -v advzip)" ]; then 
  echo 'Error: advancecomp is not installed. Try Homebrew.';
  exit 1;
fi; 
advzip -z -4 -i 60 dist/game.zip

# Measure the zip!
echo $(echo \"13312 - $(wc -c < dist/game.zip)\" | bc) bytes remain