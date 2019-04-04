/** @ts-enable */
const cosmiConfig = require('cosmiconfig');
const { resolve } = require('path');
const { defaultsDeep, reverse, uniqBy } = require('lodash');

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
    parcel: {
      cacheDir: './.cache/server',
      outDir: './dist/server',
      outFile: 'index.js',
      target: 'node',
      minify: false,
    },
  },
  sources: [],
};

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

module.exports.commandPath = (Array.isArray(module.exports.commandPath)
  ? module.exports.commandPath
  : []
).concat(resolve(__dirname, 'commands'));
