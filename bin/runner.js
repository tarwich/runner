#!/usr/bin/env node
require('dotenv/config');
const { Command } = require('commander');
const { loadCommands } = require('../src/lib/loadCommands');

const program = loadCommands();

const { args } = program.parse(process.argv);

// If no command was found
if (!args.find(arg => arg instanceof Command)) {
  // If args were present, throw help
  if (args.length) program.outputHelp();
  // Otherwise run the default command
  else program.parse('run');
}
