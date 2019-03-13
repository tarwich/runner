/** @ts-enable */
const cosmiConfig = require('cosmiconfig');
const { resolve } = require('path');
const { defaultsDeep } = require('lodash');

const explorer = cosmiConfig('runner');
const { config = {} } = explorer.searchSync() || {};

/** @type {import('config').Config} */
module.exports = {
  /** @type {string[]} */
  commandPath: [],
  /** @type {string[]} */
  commands: [],
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
   *
   * @type {string[]}
   */
  runArguments: [],
  /** Options for building server */
  server: {
    entry: 'src/server/index.js',
    parcel: {
      cacheDir: './.cache/server',
      outDir: './dist/server',
      outFile: 'index.js',
      target: 'node',
      minify: false,
    },
  },
};

Object.assign(module.exports, defaultsDeep(config, module.exports));

module.exports.commandPath =
  (Array.isArray(module.exports.commandPath) ? module.exports.commandPath : [])
  .concat(resolve(__dirname, 'commands'))
;
