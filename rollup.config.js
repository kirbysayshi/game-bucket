import babel from "rollup-plugin-babel";
import replace from "rollup-plugin-replace";
import commonjs from "rollup-plugin-commonjs";
import nodeResolve from "rollup-plugin-node-resolve";
import url from "rollup-plugin-url"
import copy from 'rollup-plugin-copy'

let pkg = require("./package.json");

const extensions = [".js", ".jsx", ".ts", ".tsx"];

export default {
  input: "./src/index.ts",
  plugins: [

    nodeResolve({ extensions }),

    // Copy imported static files into the dist folder
    // limit is the number of bytes before the image is copied instead of inlined.
    // 0 means always copy.
    // Probably want to tweak this, depending on the size and format of the image.
    url({ limit: 0 }),

    commonjs(),

    babel({ extensions, include: ["index.ts", "src/**/*"] }),

    replace({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV)
    }),

    copy({ targets: [{ src: 'src/index.html', dest: 'dist/' }] }),
  ],

  output: [
    {
      file: "dist/bundle.js",
      format: "iife",
      name: pkg.name
        .split("-")
        .map(s => s[0].toUpperCase() + s.substr(1))
        .join("")
    }
  ]
};
