const { fork } = require('child_process');
const { log } = require('../log');
const { resolve } = require('path');

const { env } = process;

function install(program, CONFIG) {
  program.command('run [client|server...]')
  .description('Run the client and server with HMR')
  .option('--no-docker', 'Disable the docker detection')
  .option(
    '--port <number>',
    'The port number on which the server should listen',
    Number,
    env.PORT || 8080
  )
  .action((components, options) => {
    const { docker, port } = options;
    fork(__filename, [], { env }).send({ CONFIG, action: 'client' });
    env.PORT = port;
    fork(__filename, [], { env }).send({ CONFIG, action: 'server', docker });
  });
}

// If this module was run through fork()
if (module.id === '.') {
  process.on('message', async({ CONFIG, action, docker } = {}) => {
    try {
      if (action === 'client') {
        log('build client', `Building ${CONFIG.client.entry}`);
        const Bundler = require('parcel-bundler');

        const bundler = new Bundler(
          resolve(CONFIG.client.entry),
          {
            ...CONFIG.client.parcel,
            watch: true,
          }
        );
        await bundler.bundle();
      }

      else if (action === 'server') {
        log('build server', `Building ${CONFIG.server.entry}`);
        const Bundler = require('parcel-bundler');

        const bundler = new Bundler(
          resolve(CONFIG.server.entry),
          {
            ... CONFIG.server.parcel,
            watch: true
          }
        );
        // Get Docker information
        if (docker) require('../lib/docker').getDockerUrls();
        // Run the server every time the build ends
        let server;
        bundler.on('buildEnd', () => {
          const { outDir } = CONFIG.server.parcel;
          log(
            'run server',
            `${server ? 'Restarting' : 'Starting'} server (${outDir})...`
          );
          if (server) server.kill();
          server = fork(outDir, CONFIG.runArguments || [], { env });
        });
        // Run the bundler
        bundler.bundle();
      }
    }
    catch (error) {
      console.error(error);
      process.exit(0);
    }
  });
}

module.exports = { install };
