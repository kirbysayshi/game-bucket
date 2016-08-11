game-bucket
===========

Common game utilities + rollup config, suitable for a small game competition. Like [JS13k](http://js13kgames.com/)!

Includes:

- [Component Entity System](lib/ces.js)
- [Stable Game Loop with interpolation and panic modes](lib/loop.js)
- [Scheduling, for game-time dependent time events](lib/time.js)
- JS13K-compatible zip creation + notice of how close you are to the limit: `npm run zip`
- Rollup, so you still get to use modules and separate files.
- More? You should make a PR!

[Rollup](https://github.com/rollup/rollup/) bundles JS using ES2015 modules, but does not leave any of the import/export syntax in the resulting bundle. It pulls everything into the same lexical scope, uniquely named. This makes it excellent for a size-based competition, because by its very nature it emits the smallest representation of code! Combined with UglifyJS this gets us very close to a nice base size.

Usage
-----

Fork this repo, then add / change code in index.js as you see fit! There are two dependencies included, but you can remove those. Rollup ensures that only code you `import` is included!

- Watch for fast rebuilds: `npm run watch`
- See what the compiled JS will look like: `npm run uglify-view`
- How close are you to the limit? (also creates a zip suitable for JS13K): `npm run zip`

The default branch for this repo is `gh-pages`, so it's easy to share your game as well!

LICENSE
-------

MIT
