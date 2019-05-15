// @ts-check
const { log } = require('../log');
const {
  existsSync,
  statSync,
  readdirSync,
  rmdirSync,
  unlinkSync,
} = require('fs');
const { resolve } = require('path');

/**
 * Remove the files or folders and all subfiles or folders
 *
 * @param {string} filePath The paths to clean
 */
const rmrf = filePath => {
  if (!existsSync(filePath)) return;
  else if (statSync(filePath).isDirectory()) {
    readdirSync(filePath).forEach(file => rmrf(resolve(filePath, file)));
    rmdirSync(filePath);
  } else unlinkSync(filePath);
};

/**
 * Remove specified output and intermediate directories
 *
 * @param {('client'|'server')[] | undefined} components The components to
 * clean. If you leave this blank, then it will remove all output and
 * intermediate directories.
 */
async function clean(components) {
  if (components && components.length) {
    components.forEach(component => {
      log('clean', `Removing .cache/${component} ...`);
      rmrf(resolve('.cache', component));
      log('clean', `Removing dist/${component} ...`);
      rmrf(resolve('dist', component));
    });
  } else {
    log('clean', 'Removing .cache/...');
    rmrf('.cache');
    log('clean', 'Removing dist/...');
    rmrf('dist');
  }
}

/**
 * @param {import('commander').Command} program The Commander instance to add
 * commands to
 */
function install(program) {
  program
    .command('clean')
    .description('Remove the .cache and dist folders')
    .action(components => clean(components).catch(console.error));
}

module.exports = { clean, install, rmrf };
