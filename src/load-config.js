/**
 * The purpose of this file is to provide a clear point for loading the
 * configuration. Previously we had a config.js, which makes it easy to get a
 * static configuration object. However, when we're testing, we need to be able
 * to reload the configuration, and it doesn't make sense to add a loader to the
 * existing config objecty.
 */

const cosmiConfig = require('cosmiconfig');
const { resolve } = require('path');
const { defaultsDeep, flatten, keyBy } = require('lodash');
const { sync: glob } = require('glob');

function loadConfig() {
  const explorer = cosmiConfig('runner');
  const { config = {} } = explorer.searchSync() || {};

  /** @type {import('config').Config} */
  const result = {
    commandPath: [],
    /** Options for building client */
    client: {
      name: 'client',
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
      name: 'server',
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

  Object.assign(result, defaultsDeep(config, result));

  const namedSources = {
    client: result.client,
    server: result.server,
    ...keyBy(result.sources, 'name'),
  };

  // I don't really like the way I'm having to do precedence here, but the glob
  // library doesn't handle it for me
  // (https://github.com/isaacs/node-glob/issues/372), so this is the best way
  // that I can think of

  if (!namedSources.client || !namedSources.client.entry) {
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
    if (entry) {
      Object.assign(result.client, namedSources.client, { entry });
      result.sources = result.sources.filter(
        source => source.name !== 'client'
      );
      result.sources.push(result.client);
    } else delete result.client;
  }

  if (!namedSources.server || !namedSources.server.entry) {
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

    // If we found a file, then we need to update the entries
    if (entry) {
      Object.assign(result.server, namedSources.server, { entry });
      result.sources = result.sources.filter(
        source => source.name !== 'server'
      );
      result.sources.push(result.server);
    } else delete result.server;
  }

  // Make sources[] override the hard-coded client/server
  // result.sources = result.sources.map(source => {
  //   const { name } = source;

  //   return {
  //     ...(name === 'client' || name === 'server' ? result[name] : {}),
  //     ...source,
  //   };
  // });

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
