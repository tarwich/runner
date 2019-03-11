/** @ts-enable */
const CosmiConfig = require('cosmiconfig');
const { resolve } = require('path');
const { defaultsDeep } = require('lodash');

const explorer = new CosmiConfig('runner');
const { config = {} } = explorer.searchSync() || {};

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

module.exports.commandPath = [].concat(
  module.exports.commandPath,
  resolve(__dirname, 'commands')
);
