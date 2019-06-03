/**
 * The purpose of this file is to provide a clear point for loading the
 * configuration. Previously we had a config.js, which makes it easy to get a
 * static configuration object. However, when we're testing, we need to be able
 * to reload the configuration, and it doesn't make sense to add a loader to the
 * existing config objecty.
 */

const cosmiConfig = require('cosmiconfig');
const { resolve } = require('path');
const { defaultsDeep, flatten, reverse, uniqBy } = require('lodash');
const { sync: glob } = require('glob');

function loadConfig() {
  const explorer = cosmiConfig('runner');
  const { config = {} } = explorer.searchSync() || {};

  /** @type {import('config').Config} */
  const result = {
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
      custom: {},
    },
  };

  // I don't really like the way I"m having to do precedence here, but the glob
  // library doesn't handle it for me
  // (https://github.com/isaacs/node-glob/issues/372), so this is the best way
  // that I can think of

  {
    const files = glob('{src/,}client/index.{html,htm,tsx,ts,jsx,js}');
    const entry = [
      // This is the precedence that files should be loaded
      /^src\/client\/.*\.html?$/,
      /^src\/client\/.*\.ts$/,
      /^src\/client\/.*\.js$/,
      /^client\/.*\.html?$/,
      /^client\/.*\.ts$/,
      /^client\/.*\.js$/,
    ]
      .map(regex => files.find(file => regex.test(file)))
      .filter(Boolean)[0];
    if (entry) result.client.entry = entry;
  }

  {
    const files = glob('{src/,}server/index.{tsx,ts,jsx,js}');
    const entry = [
      // This is the precedence that files should be loaded
      /^src\/server\/.*\.ts$/,
      /^src\/server\/.*\.js$/,
      /^server\/.*\.ts$/,
      /^server\/.*\.js$/,
    ]
      .map(regex => files.find(file => regex.test(file)))
      .filter(Boolean)[0];
    if (entry) result.server.entry = entry;
  }

  Object.assign(result, defaultsDeep(config, result));

  // Make sources[] override the hard-coded client/server
  result.sources = uniqBy(
    reverse(result.sources)
      .concat(
        { ...result.client, name: 'client' },
        { ...result.server, name: 'server' }
      )
      .map((item, i) => ({ name: `source${i + 1}`, ...item })),
    'name'
  );

  // Flatten and resolve all the command paths so that we can support receiving
  // commandPath as an array or a string
  result.commandPath = flatten(
    ['']
      .concat(result.commandPath, resolve(__dirname, 'commands'))
      .filter(Boolean)
  ).map(/** @param {string} a */ a => resolve(a));

  return result;
}

module.exports = {
  loadConfig,
};
