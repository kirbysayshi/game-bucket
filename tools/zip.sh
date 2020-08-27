#!/bin/bash

set -x
set -e

# not type checking, because...
# yarn check

yarn clean

# build
NODE_ENV=production yarn build

# compress JS
terser dist/bundle.js --compress --mangle --mangle-props -o dist/bundle.min.js
mv -f dist/bundle.min.js dist/bundle.js

# replace string constants with shorter, yet unique, values
NODE_SCRIPT=$(cat <<-END
  var txt = fs.readFileSync("/dev/stdin","utf8");
  const replaced = txt
    .replace(/"v-movement"/g, "\"mv\"")
    .replace(/"draw-console"/g, "\"dc\"")

  fs.writeFileSync("dist/bundle.js", replaced);
END
)
<dist/bundle.js node -e "$NODE_SCRIPT"

# minify HTML
html-minifier \
  --collapse-whitespace \
  --remove-comments \
  --remove-optional-tags \
  --remove-redundant-attributes \
  --remove-script-type-attributes \
  --remove-tag-whitespace \
  --use-short-doctype \
  --minify-css true \
  --minify-js true \
  dist/index.html -o dist/index.min.html
mv -f dist/index.min.html dist/index.html

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
echo $(echo "13312 - $(wc -c < dist/game.zip)" | bc) bytes remain