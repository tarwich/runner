// @ts-check
const { fork } = require('child_process');
const { log } = require('../log');
const { resolve } = require('path');
const { existsSync } = require('fs');
const shell = require("shelljs");

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
    /** @type Map<string, import('config').SourceInternal> */
    const sourceById = new Map();
    const completedSources = new Set();

    // Set up source lookups and convert each source to an internal source structure
    /** @type import('config').SourceInternal[] */
    const sources = CONFIG.sources.map(source => {
      if (source.name) sourceById.set(source.name, source);
      /** @type string[] */
      const childSources = [];

      return Object.assign(source, {
        childSources
      });
    });

    // Set up parent/child relationships between sources
    sources.forEach(source => {
      if (Array.isArray(source.dependencies) && source.dependencies.length > 0) {
        source.dependencies
          .forEach(dep => {
            const parent = sourceById.get(dep);

            if (parent && parent.childSources) {
              parent.childSources.push(source.name || '');
            }
          });
      }
    });

    // This will store the sources that are still waiting for their dependencies to complete compiling
    let waitingForDependencies = new Set();
    // This is the process queue that will actively handle ready sources
    let toProcess = sources.slice(0);
    // This stores all of the Promises each source will produce while processing. These promises are completed when the
    // source has completed it's first build successfully.
    /** @type Promise<void>[] */
    let processFirstBuildPromises = [];

    /**
     * This processes a source and returns a  promise to indicate first build has completed.
     * @param {import('../types/config').SourceInternal} source
     */
    async function processSource(source) {
      let resolve = () => {};
      const promise = new Promise(r => (resolve = r));
      const id =  `${Date.now()}`;

      if (source.name) {
        // The stdout and stderr will be null UNLESS stdio is set to 'pipe'. I know not why but did as a comment suggested:
        // https://stackoverflow.com/questions/27786228/node-child-process-spawn-stdout-returning-as-null
        const child = fork(__filename, [], { env, stdio: 'pipe' });

        // The child process SHOULD emit a 'finish {source name}: id' pattern to indicate it completed a build.
        if (child.stdout) {
          let waitingForFirstComplete = true;

          child.stdout.on('data', data => {
            const output = data.toString();

            // See if our identifier was output which indicates the process completed successfully
            if (waitingForFirstComplete && output.toLowerCase().indexOf('finish') > -1) {
              if (data.indexOf(id) > -1) {
                waitingForFirstComplete = false;
                completedSources.add(source.name);
                resolve();
              }
            }

            // Otherwise, print the info the process provided
            else {
              console.log(output);
            }
          });
        }

        // No stdout means we have no way to tell when a bundler finished a build
        else {
          resolve();
        }

        child.send({ CONFIG, action: source.name, docker, id });
      }

      else {
        resolve();
      }

      await promise;
    }

    // Keep looping through the process queue so long as it's full
    for (let i = 0; toProcess.length > 0; ++i) {
      // If we're at the end of the process queue, we wait for the current processing items to complete one build
      // before processing the wait queue
      if (i === toProcess.length) {
        await Promise.all(processFirstBuildPromises);

        // If our process queue is the same length as our wait queue, then we have placed all of our remaining process
        // items into a wait state, which  will never resolve. This would indicate a circular dependency.
        if (toProcess.length === waitingForDependencies.size) {
          console.error(
            'Could not process all sources! Some sources never resolved thus indicating a potential circular dependency!'
          );

          return;
        }

        // After the processes have completed, we can now dequeue our waiting sources and begin processing them to see
        // if they can resolve now that new modules have resolved themselves
        toProcess = Array.from(waitingForDependencies.values());
        // Start at the beginning of the process queue
        i = -1;
        waitingForDependencies.clear();
      }

      else {
        const next = toProcess[i];
        let canProcess = true;

        // See if the source has dependencies, if so, we must make sure the dependencies are processed first
        if (next.dependencies && next.dependencies.length > 0) {
          // Simply look to see if ANY parent source is not completed yet, if so we can not process yet
          for (let k = 0; k < next.dependencies.length; ++k) {
            const parent = next.dependencies[k];
            if (!completedSources.has(parent)) {
              canProcess = false;
              break;
            }
          }
        }

        // If we can't process this source yet, we simply put it in the wait queue and move onto the next item
        if (!canProcess) {
          waitingForDependencies.add(next);
          continue;
        }

        // Here, we can assume it is fine to process this source
        processFirstBuildPromises.push(processSource(next));
      }
    }
  }
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
    /** @type {{CONFIG: import('config').Config, action: string, docker: boolean, id: string}} */
    const { CONFIG, action, docker, id } = options;

    // Have an easy lookup for the sources available to the process
    const sourceById = new Map();
    CONFIG.sources.forEach(s => sourceById.set(s.name, s));

    try {
      const source = CONFIG.sources.find(item => item.name === action);
      if (!source) console.error(`Source type ${action} invalid`);
      else {
        const runArguments = source.runArguments || CONFIG.runArguments;

        if (source.entry) {
          log(`Run ${action}`, `First Build ${source.entry}`);
          const Bundler = require('parcel-bundler');

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
              child = fork(outPath, runArguments || [], { env });
            });
          }

          let firstBuild = true;

          // Add a log message out to indicate the completion of the build or trigger depencies
          bundler.on('buildEnd', () => {

            // Submit the flag for the first build to have the dependencies complete running
            if (firstBuild) {
              firstBuild = false;
              log(
                `Finish ${source.name}`,
                `${id}`
              );

              // After first build, set up logging for subsequent rebundles
              bundler.on('buildStart', () => {
                log(`Run ${action}`, `Building ${source.entry}`);
              });
            }

            // Otherwise, subsequent changes should make watching dependencies trigger, so we can
            // do this in a sneaky way by touching the dependencies entry file.
            else if (source.childSources && source.childSources.length) {
              source.childSources.forEach(childName => {
                const child = sourceById.get(childName);
                if (!child) return;
                shell.exec(`touch ${resolve(child.entry)}`);
              });
            }
          });

          // Run the bundler
          bundler.bundle();
        } else if (source.run && typeof source.run === 'string') {
          log(
            `Run ${source.name}`,
            `Starting ${source.name} (${source.run})...`
          );
          fork(source.run, runArguments || [], { env });
        } else {
          throw new Error(`Source "${source.name}" has no "entry" property`);
        }
      }
    } catch (error) {
      console.error(error);
      process.exit(0);
    }
  });
}

module.exports = { install, run };
