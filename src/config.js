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

// Flatten and resolve all the command paths so that we can support receiving
// commandPath as an array or a string
module.exports.commandPath = []
  // @ts-ignore (I can't figure out how to concat this without TypeScript
  // complaining about never[])
  .concat(module.exports.commandPath, resolve(__dirname, 'commands'))
  .flat(1)
  .map(/** @param {string} a */ a => resolve(a));
