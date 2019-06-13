// @ts-check
const { fork } = require('child_process');
const { log } = require('../log');
const { resolve } = require('path');
const { nonEmptyString } = require('../lib/type-guards');
const { existsSync } = require('fs');

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
 * @param {string[]} components The components to run (default: ['client',
 * 'server'])
 * @param {object} options See below
 * @param {boolean} options.docker Enable detection of docker port
 * @param {number | string} options.port Set the port on which the server will
 * listen
 */
async function run(components, options) {
  const { docker, port } = options;
  env.PORT = String(port);

  if (components.length === 0) {
    components = CONFIG.sources.map(item => item.name).filter(nonEmptyString);
  }

  components.forEach(component => {
    fork(__filename, [], { env }).send({ CONFIG, action: component, docker });
  });
}

/**
 * @param {import('commander').Command} program The commander instance to add
 * commands to
 * @param {import('config').Config} config The configuration from rnuner
 */
function install(program, config) {
  CONFIG = config;
  program
    .command(`run [${config.sources.map(source => source.name).join('|')}...]`)
    .description('Run the client and server with HMR')
    .option('--no-docker', 'Disable the docker detection')
    .option(
      '--port <number>',
      'The port number on which the server should listen',
      Number,
      env.PORT || 8080
    )
    .action((components, options) =>
      run(components, options).catch(console.error)
    );
}

// If this module was run through fork()
// @ts-ignore
if (module.id === '.') {
  process.on('message', async (options = {}) => {
    /** @type {{CONFIG: import('config').Config, action: string, docker: boolean}} */
    const { CONFIG, action, docker } = options;

    try {
      const source = CONFIG.sources.find(item => item.name === action);
      if (!source) console.error(`Source type ${action} invalid`);
      else {
        log(`run ${action}`, `Building ${source.entry}`);
        const Bundler = require('parcel-bundler');

        if (!source.entry) {
          throw new Error(`Source "${source.name}" has no "entry" property`);
        }

        if (!existsSync(resolve(source.entry))) {
          throw new Error(`Can not find source entry file "${source.entry}"`);
        }

        const bundler = new Bundler(resolve(source.entry), {
          ...source.parcel,
          watch: true,
        });
        const { run, parcel: { outDir = '', outFile = '' } = {} } = source;
        // Get Docker information
        if (docker && source.docker) require('../lib/docker').getDockerUrls();
        /** @type {import('child_process').ChildProcess} */
        let child;
        if (run && outDir) {
          const outPath = `${outDir}/${outFile}`;
          // Run the source every time the build ends
          bundler.on('buildEnd', () => {
            log(
              `Run ${source.name}`,
              `${child ? 'Restarting' : 'Starting'} ${
                source.name
              } (${outPath})...`
            );
            if (child) child.kill();
            child = fork(outPath, CONFIG.runArguments || [], { env });
          });
        }
        // Run the bundler
        bundler.bundle();
      }
    } catch (error) {
      console.error(error);
      process.exit(0);
    }
  });
}

module.exports = { install, run };
