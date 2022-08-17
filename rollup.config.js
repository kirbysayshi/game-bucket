// @ts-check

import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import url from '@rollup/plugin-url';
import copy from 'rollup-plugin-copy';
import pkg from './package.json';

const extensions = ['.js', '.jsx', '.ts', '.tsx'];

const pluginTransformConstToLet = () => ({
  renderChunk(chunk) {
    return chunk.replace(/\bconst\b/g, 'let');
  },
});

// Replace well-known string constants with shorter, yet unique, names!
const pluginShortenKnownStrings = () => ({
  renderChunk(chunk) {
    const pairs = [
      ['v-movement', 'mv'],
      ['draw-console', 'dc'],
      ['viewport', 'vp'],
      ['drag-state', 'ds'],
      ['pointer-target', 'pt'],
      ['spring-constraint', 'sc'],
    ];

    const shorts = new Set();

    for (const [long, short] of pairs) {
      if (shorts.has(short))
        throw new Error(`Need a unique short name! Got ${short}`);
      shorts.add(short);
      chunk = chunk.replace(
        new RegExp(`['"]${long}['"]`, 'g'),
        JSON.stringify(short)
      );
    }

    return chunk;
  },
});

// Replace typescript assertions. Hacky to do it via regex, but it's well-known
// and easier than writing a rollup plugin. Note that this uses a negative
// lookbehind to avoid targeting the function definition itself, only supported
// in V8.
const pluginRemoveTypescriptAssertions = () => ({
  renderChunk(chunk) {
    return chunk.replace(/(?<!function )assertDefinedFatal\([^)]+\)/g, '');
  },
});

export default {
  input: './src/index.ts',
  plugins: [
    resolve({ extensions }),

    // Copy imported static files into the dist folder
    // limit is the number of bytes before the image is copied instead of inlined.
    // 0 means always copy.
    // Probably want to tweak this, depending on the size and format of the image.
    url({
      limit: 0,
      include: [
        '**/*.svg',
        '**/*.png',
        '**/*.jpg',
        '**/*.gif',
        '**/*.mp4',
        '**/*.mp3',
        '**/*.ttf',
      ],
    }),

    commonjs(),

    babel({ extensions, babelHelpers: 'bundled', include: ['src/**/*'] }),

    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),

    ...(process.env.NODE_ENV === 'production'
      ? [
          pluginTransformConstToLet(),
          pluginShortenKnownStrings(),
          pluginRemoveTypescriptAssertions(),
        ]
      : []),

    copy({ targets: [{ src: 'src/index.html', dest: 'dist/' }] }),
  ],

  output: [
    {
      file: 'dist/bundle.js',
      format: 'iife',
      name: pkg.name
        .split('-')
        .map((s) => s[0].toUpperCase() + s.substr(1))
        .join(''),
    },
  ],
};
