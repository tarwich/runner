const { Command } = require('commander');
const { readdirSync, statSync } = require('fs');
const { resolve } = require('path');

// /--[ Config ]----------------------------------------------------------------
const CONFIG = require('../config');
const PACKAGE = require(resolve('package.json'));
// \--[ Config ]----------------------------------------------------------------

function loadCommands() {
  const program = new Command();
  program.version(PACKAGE.version);

  // Load up the commands
  CONFIG.commandPath.forEach(path => {
    readdirSync(path).forEach(file => {
      const filePath = resolve(path, file);

      if (statSync(filePath).isFile()) {
        const { install } = require(filePath);

        if (install) install(program, CONFIG);
        else console.error(`Command ${file} is missing 'install' function`);
      }
    });
  });

  return program;
}

module.exports = { loadCommands };
