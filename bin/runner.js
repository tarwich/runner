#!/usr/bin/env node
require('dotenv/config');
const { Command } = require('commander');
const { resolve } = require('path');
const { readdirSync, statSync } = require('fs');

// /--[ Config ]----------------------------------------------------------------
const CONFIG = require('../src/config');
const PACKAGE = require(resolve('package.json'));
// \--[ Config ]----------------------------------------------------------------

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

const { args } = program.parse(process.argv);

// If no command was found
if (!args.find(arg => arg instanceof Command)) {
  // If args were present, throw help
  if (args.length) program.outputHelp();
  // Otherwise run the default command
  else program.parse('run');
}
