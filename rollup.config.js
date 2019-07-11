import babel from "rollup-plugin-babel";
import replace from "rollup-plugin-replace";
import commonjs from "rollup-plugin-commonjs";
import nodeResolve from "rollup-plugin-node-resolve";

let pkg = require("./package.json");

const extensions = [".js", ".jsx", ".ts", ".tsx"];

export default {
  // entry: 'index.js',
  input: "./index.ts",
  plugins: [
    nodeResolve({ extensions }),

    // commonjs({
    //   include: 'node_modules/**',
    // }),
    commonjs(),

    babel({ extensions, include: ["index.ts", "src/**/*"] }),

    replace({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV)
    })
  ],
  //external: external,

  output: [
    {
      file: "bundle.js",
      format: "iife",
      name: pkg.name
        .split("-")
        .map(s => s[0].toUpperCase() + s.substr(1))
        .join("")
    }
  ]

  // targets: [
  //   {
  //     dest: 'bundle.js',
  //     format: 'iife',
  //     sourceMap: process.env.NODE_ENV !== 'production'
  //       ? 'inline'
  //       : false,
  //   },
  // ]
};
