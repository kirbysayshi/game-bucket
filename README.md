# game-bucket

Common game utilities + rollup config, suitable for a small game competition. Like [JS13k](http://js13kgames.com/)! In TypeScript!

Examples:

- [Signal Decay, JS13K-2020](https://github.com/kirbysayshi/js13k-2020/)
- [Health Alchemy (Incomplete), JS13K-2019](https://github.com/kirbysayshi/js13k-2019)
- [Ghost High Fiver (Incomplete), JS13K-2018](https://github.com/kirbysayshi/ghost-high-fiver)
- [Night Shift Barisa, JS13K-2016](https://github.com/kirbysayshi/night-shift-barista)

Includes:

- [Component Entity System](lib/ces.js)
- [Stable Game Loop with interpolation and panic modes](lib/loop.js)
- [Scheduling, for game-time dependent time events](lib/time.js)
- JS13K-compatible zip creation + notice of how close you are to the limit: `yarn zip`
- Rollup, so you still get to use modules and separate files.
- More? You should make a PR!

[Rollup](https://github.com/rollup/rollup/) bundles JS using ES2015 modules, but does not leave any of the import/export syntax in the resulting bundle. It pulls everything into the same lexical scope, uniquely named. This makes it excellent for a size-based competition, because by its very nature it emits the smallest representation of code! Combined with UglifyJS this gets us very close to a nice base size.

## Usage

Fork this repo, then add / change code in src/index.js as you see fit! There are dependencies included, but you can remove those. Rollup ensures that only code you `import` is included!

- Static files can be configured for copying in [rollup.config.js](./rollup.config.js). Default is just [`src/index.html`](src/index.html)
- Static files that are `import`ed are automatically copied into the `dist/` folder by rollup.
- [Roadroller](https://github.com/lifthrasiir/roadroller) is ready! Check [tools/zip.sh](./tools/zip.sh).
- PNG/ZIP optimizations are handled by [Efficient-Compression-Tool](https://github.com/fhanau/Efficient-Compression-Tool) (ect).

### `yarn start`

Run type checking, rollup, and a local http server in watch mode.

### `yarn zip`

How close are you to the limit? Compiles in production mode, and creates a zip suitable for JS13K in `/dist`!

### `yarn deploy`

Build a zip, then deploy the `dist` folder to `gh-pages` seamlessly! Best for testing your game on multiple devices.

### `yarn http-server dist/`

Done automatically by `yarn start`, but perhaps you just ran `yarn zip` and want to run the actual compiled/mangled code.

## LICENSE

MIT
