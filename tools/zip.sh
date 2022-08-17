#!/bin/bash

set -x
set -e

yarn clean

# build with rollup
NODE_ENV=production yarn build

# compress JS
terser dist/bundle.js --compress --mangle --mangle-props -o dist/bundle.min.js
mv -f dist/bundle.js dist/bundle-original.js
mv -f dist/bundle.min.js dist/bundle.js

# # Uncomment to Use Roadroller
# # Caution: this can make the final output larger! It depends on the size of the input.
# cp dist/bundle.js dist/bundle.original.js
# NODE_SCRIPT=$(cat <<-END
#   const RR = require("roadroller");
#   var txt = fs.readFileSync("/dev/stdin","utf8");
#   const p = new RR.Packer([{ data: txt, type: "js", action: "eval" }], {});
#   p.optimize(2).then(() => {
#     const { firstLine, secondLine } = p.makeDecoder();
#     fs.writeFileSync("dist/bundle.js", firstLine + "\n" + secondLine);
#   });
# END
# )
# <dist/bundle.js node -e "$NODE_SCRIPT"

# Inline the script bundle
NODE_SCRIPT=$(cat <<-END
  var html = fs.readFileSync("/dev/stdin","utf8");
  var js = fs.readFileSync("./dist/bundle.js", "utf8");
  const replaced = html.replace(/<!-- REPLACER START -->[\s\S]+<!-- REPLACER END -->/gm, "<script>" + js + "</script>");
  fs.writeFileSync("dist/index.html", replaced);
END
)
<dist/index.html node -e "$NODE_SCRIPT"

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
mv dist/index.html dist/index.original.html
mv dist/index.min.html dist/index.html

# Optimize assets copied by rollup
# find dist/ -iname '*.png' -exec ./tools/tinypng.sh {} {} \;
# optimize texture-packed json, if applicable
# node tools/shrink-texture-packer-json.js ./assets/sprites.json ./assets/sprites.json

# Create/optimize the zip
pushd dist/
# ECT has much better compression than advzip, often times beating even the
# roadrolled+advzip version just by itself! NOTE: it also optimizes PNGs and
# JPEGs.
$(node -p "require('ect-bin')") -strip -zip -10009 index.html *.png *.svg *.bmp
# zip -X -r game.zip index.html *.png *.svg *.bmp *.js
popd

# # Optimize the zip
# if ! [ -x "$(command -v advzip)" ]; then 
#   echo 'Error: advancecomp is not installed. Try Homebrew.';
#   exit 1;
# fi; 
# advzip -z -4 -i 60 dist/index.html.zip

# Measure the zip!
echo $(echo "13312 - $(wc -c < dist/index.html.zip)" | bc) bytes remain