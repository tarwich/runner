/** @ts-enable */
const cosmiConfig = require('cosmiconfig');
const { resolve } = require('path');
const { existsSync, readdirSync } = require('fs');
const { defaultsDeep, flatten, reverse, uniqBy } = require('lodash');
const { sync: glob } = require('globby');

const explorer = cosmiConfig('runner');
const { config = {} } = explorer.searchSync() || {};

/** @type {import('config').Config} */
module.exports = {
  commandPath: [],
  /** Options for building client */
  client: {
    entry: 'src/client/index.html',
    parcel: {
      cacheDir: './.cache/client',
      outDir: './dist/client',
      target: 'browser',
    },
  },
  /**
   * Arguments to pass to run
   */
  runArguments: [],
  /** Options for building server */
  server: {
    entry: 'src/server/index.js',
    run: true,
    docker: true,
    parcel: {
      cacheDir: './.cache/server',
      outDir: './dist/server',
      outFile: 'index.js',
      target: 'node',
      minify: false,
    },
  },
  sources: [],
  lint: {
    carets: {
      dependencies: 'strict',
      devDependencies: 'strict',
    },
    prettier: {
      paths: ['$EXTENSIONS', '{src,test,scripts}/{,**/}$EXTENSIONS'],
    },
    custom: [],
  },
};

const files = glob('src/server/index.{tsx,ts,jsx,js}');
if (files.length) module.exports.server.entry = files[0];

Object.assign(module.exports, defaultsDeep(config, module.exports));

// Make sources[] override the hard-coded client/server
module.exports.sources = uniqBy(
  reverse(module.exports.sources)
    .concat(
      { ...module.exports.client, name: 'client' },
      { ...module.exports.server, name: 'server' }
    )
    .map((item, i) => ({ name: `source${i + 1}`, ...item })),
  'name'
);

// Flatten and resolve all the command paths so that we can support receiving
// commandPath as an array or a string
module.exports.commandPath = flatten(
  []
    // @ts-ignore (I can't figure out how to concat this without TypeScript
    // complaining about never[])
    .concat(module.exports.commandPath, resolve(__dirname, 'commands'))
).map(/** @param {string} a */ a => resolve(a));
