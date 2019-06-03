const { loadConfig } = require('./load-config');

<<<<<<< HEAD
const explorer = cosmiConfig('runner');
const { config = {} } = explorer.searchSync() || {};

/** @type {import('config').Config} */
module.exports = {
  commandPath: [],
  /**
   * Arguments to pass to run
   */
  runArguments: [],
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

// Autodetect the client. We search src/, test/ and the root for a client folder
// "test/" is included for library building scenarios.
const clientFiles = glob('{src/,test/,}client/index.{html,tsx,ts,jsx,js}');

if (clientFiles.length) {
  module.exports.sources.push({
    name: 'client',
    entry: clientFiles[0],
    parcel: {
      cacheDir: './.cache/client',
      outDir: './dist/client',
      target: 'browser',
    },
  });
}

// Autodetect the server. We search src/, test/ and the root for a server folder
// "test/" is included for library building scenarios.
const serverFiles = glob('{src/,test/,}server/index.{html,tsx,ts,jsx,js}');

if (serverFiles.length) {
  module.exports.sources.push({
    name: 'server',
    entry: serverFiles[0],
    run: true,
    docker: true,
    parcel: {
      cacheDir: './.cache/server',
      outDir: './dist/server',
      outFile: 'index.js',
      target: 'node',
      minify: false,
    },
  });
}

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
=======
/** @type {import('config').Config } */
module.exports = loadConfig();
>>>>>>> fc9ce7a89873412a8c76ff6fb5c48118b31fec2b
