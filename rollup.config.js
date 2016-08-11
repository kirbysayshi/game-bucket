import babel from 'rollup-plugin-babel';
import babelrc from 'babelrc-rollup';
import replace from 'rollup-plugin-replace';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

let pkg = require('./package.json');
let external = Object.keys(pkg.dependencies);

export default {
  entry: 'index.js',
  plugins: [
    babel(babelrc()),
	  nodeResolve({ jsnext: true, main: true }),
    commonjs({
      include: 'node_modules/**',
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    }),
  ],
  //external: external,
  targets: [
    {
      dest: 'bundle.js',
      format: 'iife',
      sourceMap: process.env.NODE_ENV !== 'production'
        ? 'inline'
        : false,
    },
  ]
};
