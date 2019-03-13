// @ts-check
const { fork } = require('child_process');
const { log } = require('../log');
const { resolve } = require('path');

const { env } = process;
/** @type {import('config').Config} */
let CONFIG;

/**
 * Run the server
 *
 * This function also builds and watches the server and client files. It is
 * intended for development, not production. For production, you should call the
 * generated files.
 *
 * @param {object} options See below
 * @param {boolean} options.docker Enable detection of docker port
 * @param {number | string} options.port Set the port on which the server will listen
 */
async function run(options) {
  const { docker, port } = options;
  fork(__filename, [], { env }).send({ CONFIG, action: 'client' });
  env.PORT = String(port);
  fork(__filename, [], { env }).send({ CONFIG, action: 'server', docker });
}

/**
 * @param {import('commander').Command} program The commander instance to add
 * commands to
 * @param {import('config').Config} config The configuration from rnuner
 */
function install(program, config) {
  CONFIG = config;
  program.command('run')
  .description('Run the client and server with HMR')
  .option('--no-docker', 'Disable the docker detection')
  .option(
    '--port <number>',
    'The port number on which the server should listen',
    Number,
    env.PORT || 8080
  )
  .action(options => run(options).catch(console.error));
}

// If this module was run through fork()
// @ts-ignore
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
        /** @type {import('child_process').ChildProcess} */
        let server;
        // Run the server every time the build ends
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

module.exports = { install, run };
