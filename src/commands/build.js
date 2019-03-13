const { fork } = require('child_process');
const { log } = require('../log');
const { resolve } = require('path');

const { env } = process;
/** @type {import('config').Config} */
let CONFIG;

/**
 * Build the client and / or server
 *
 * @param {('client' | 'server')[]} components The components to build. Defaults
 * to everything, but if you wnat to only build client or server, you may
 * provide them here to restrict the process.
 */
function build(components = ['client', 'server']) {
  if (components.length === 0) components = ['client', 'server'];
  return Promise.all(
    components.map(action => new Promise(resolve =>
      fork(__filename, [], { env })
      .on('exit', () => resolve())
      .send({ CONFIG, action }))
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
  program.command('build [client|server...]')
  .description('Build the client and / or the server')
  .action(components => build(components).catch(console.error));
}

// If this module was run through fork()
// @ts-ignore
if (module.id === '.') {
  process.on('message', async({ CONFIG, action } = {}) => {
    try {
      if (action === 'client') {
        log('build client', `Building ${CONFIG.client.entry}`);
        const Bundler = require('parcel-bundler');

        if (CONFIG) {
          const bundler = new Bundler(
            resolve(CONFIG.client.entry),
            CONFIG.client.parcel,
          );
          await bundler.bundle();
          process.exit();
        }
      }
      if (action === 'server') {
        log('build server', `Building ${CONFIG.server.entry}`);
        const Bundler = require('parcel-bundler');

        if (CONFIG) {
          const bundler = new Bundler(
            resolve(CONFIG.server.entry),
            CONFIG.server.parcel
          );
          await bundler.bundle();
          process.exit();
        }
      }
    }
    catch (error) {
      console.error(error);
      process.exit(0);
    }
  });
}

module.exports = { install, build };
