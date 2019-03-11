const { log } = require('../log');
const { existsSync, statSync, readdirSync, rmdirSync, unlinkSync } = require('fs');
const { resolve } = require('path');

/**
 * Remove the files or folders and all subfiles or folders
 *
 * @param {string[] | string} filePath The paths to clean
 */
const rmrf = filePath => {
  if (!existsSync(filePath)) return;
  else if (statSync(filePath).isDirectory()) {
    readdirSync(filePath).forEach(file => rmrf(resolve(filePath, file)));
    rmdirSync(filePath);
  }
  else unlinkSync(filePath);
};

function install(program) {
  program.command('clean')
  .description('Remove the .cache and dist folders')
  .action(() => {
    log('clean', 'Removing .cache/...');
    rmrf('.cache');
    log('clean', 'Removing dist/...');
    rmrf('dist');
  });
}

module.exports = { install, rmrf };
