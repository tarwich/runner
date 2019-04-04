const { fork } = require('child_process');
const { log } = require('../log');
const { resolve } = require('path');

const { env } = process;
/** @type {import('config').Config} */
let CONFIG;

/**
 * Build the client and / or server
 *
 * @param {string[]} components The components to build. Defaults
 * to everything, but if you wnat to only build client or server, you may
 * provide them here to restrict the process.
 */
function build(components = []) {
  if (components.length === 0)
    components = CONFIG.sources.map(source => source.name);
  return Promise.all(
    components.map(
      action =>
        new Promise(resolve =>
          fork(__filename, [], { env })
            .on('exit', () => resolve())
            .send({ CONFIG, action })
        )
    )
  );
}

/**
 * @param {import('commander').Command} program The Commander instance to add
 * commands to
 * @param {import('config').Config} config The runner configuration
 */
function install(program, config) {
  CONFIG = config;
  program
    .command(`build [${config.sources.map(s => s.name).join('|')}...]`)
    .description('Build the client and / or the server')
    .action(components => build(components).catch(console.error));
}

// If this module was run through fork()
// @ts-ignore
if (module.id === '.') {
  process.on('message', async (options = {}) => {
    /** @type {{CONFIG: import('config').Config, action: string}} */
    const { CONFIG, action } = options;

    try {
      const source = CONFIG.sources.find(item => item.name === action);
      if (!source) console.error(`Source type ${action} invalid`);
      else {
        log(`build ${action}`, `Building ${source.entry}`);
        const Bundler = require('parcel-bundler');

        if (CONFIG) {
          const bundler = new Bundler(resolve(source.entry), source.parcel);
          await bundler.bundle();
          process.exit();
        }
      }
    } catch (error) {
      console.error(error);
      process.exit(0);
    }
  });
}

module.exports = { install, build };
