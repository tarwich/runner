const { fork } = require('child_process');
const { log } = require('../log');
const { resolve } = require('path');

const { env } = process;

module.exports = (program, CONFIG) => {
  program.command('build [client|server...]')
  .action((components, options) => {
    Object.assign(options, options.parent, options);
    fork(__filename, [], { env }).send({ CONFIG, action: 'client' });
    fork(__filename, [], { env }).send({ CONFIG, action: 'server' });
  });
};

// If this module was run through fork()
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
