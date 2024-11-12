const babel = require("@rollup/plugin-babel");
const json = require("@rollup/plugin-json");
const pkg = require("./package.json");
const serve = require("rollup-plugin-serve");
const license = require("rollup-plugin-license");
const terser = require("@rollup/plugin-terser");

let { buildTarget } = process.env;

if (typeof buildTarget === "undefined") {
  console.log('buildTarget undefined - setting to "DEV"');
  buildTarget = "DEV";
}

console.log(`buildTarget: ${buildTarget}`);

const env = {
  dev: buildTarget === "DEV",
  prod: buildTarget === "PROD",
};

const bannerText = `
<%= pkg.name %> v<%= pkg.version %>
<%= pkg.homepage %>
<%= pkg.description %>

Copyright 2013–<%= moment().format('YYYY') %>, <%= pkg.author %>
@license <%= pkg.license %>
`.trim();

const commonPreBabelOperations = isLocale => [
  isLocale
    ? undefined
    : import('./locales-src/rollup-optimized-css-text.js').then(module =>
        module.default({ minify: env.prod })
      ),
  isLocale ? json() : undefined,
];

const commonPostBabelOperations = isModule => [
  env.prod &&
    terser({
      format: {
        comments: false,
      },
      compress: {
        unsafe: true,
        unsafe_arrows: isModule,
        unsafe_math: true,
      },
    }),
  license({
    sourcemap: true,
    banner: bannerText,
  }),
];

module.exports = [
  {
    input: "browser.js",
    output: {
      file: pkg.main,
      format: "iife",
      name: "scratchblocks",
      sourcemap: env.prod,
    },
    plugins: [
      ...commonPreBabelOperations(),
      babel({ babelHelpers: "bundled" }),
      ...commonPostBabelOperations(),
      env.dev &&
        serve({
          contentBase: ".",
          port: 8000,
        }),
    ],
  },
  {
    input: "browser.es.js",
    output: {
      file: pkg.module,
      format: "esm",
      sourcemap: env.prod,
    },
    plugins: [
      ...commonPreBabelOperations(),
      ...commonPostBabelOperations(true),
      env.dev &&
        serve({
          contentBase: ".",
          port: 8000,
        }),
    ],
  },
  {
    input: "locales-src/translations.js",
    output: {
      exports: "named",
      file: "build/translations.js",
      format: "iife",
      name: "translations",
      sourcemap: false,
    },
    plugins: [
      ...commonPreBabelOperations(true),
      babel({ babelHelpers: "bundled" }),
      ...commonPostBabelOperations(),
    ],
  },
  {
    input: "locales-src/translations-es.js",
    output: {
      file: "build/translations-es.js",
      format: "esm",
      sourcemap: false,
    },
    plugins: [
      ...commonPreBabelOperations(true),
      ...commonPostBabelOperations(true),
    ],
  },
  {
    input: "locales-src/translations-all.js",
    output: {
      file: "build/translations-all.js",
      format: "iife",
      name: "translationsAll",
      sourcemap: false,
    },
    plugins: [
      ...commonPreBabelOperations(true),
      babel({ babelHelpers: "bundled" }),
      ...commonPostBabelOperations(),
    ],
  },
  {
    input: "locales-src/translations-all-es.js",
    output: {
      file: "build/translations-all-es.js",
      format: "esm",
      sourcemap: false,
    },
    plugins: [
      ...commonPreBabelOperations(true),
      ...commonPostBabelOperations(true),
    ],
  },
];
