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
        const command = require(filePath);

        const missing = ['install', 'run']
        .filter(key => !command[key])
        .map(key => `'${key}'`);

        if (missing.length)
          console.error(`Command ${file} is missing methods: ${missing}`);
        else command.install(program, CONFIG);
      }
    });
  });

  return program;
}

module.exports = { loadCommands };
