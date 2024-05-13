import { default as Config } from './rollup.config.js';
import copy from 'rollup-plugin-copy';

const plugins = Config.plugins.filter((p) => p.name !== 'copy');

export default {
  ...Config,
  plugins: [
    ...plugins,
    copy({ targets: [{ src: 'src/demos/index.html', dest: 'dist-demos/' }] }),
  ],
  input: './src/demos/index.ts',

  output: {
    file: 'dist-demos/bundle.js',
    format: 'iife',
    inlineDynamicImports: true,
  },
};
