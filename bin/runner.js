#!/usr/bin/env node
require('dotenv/config');
const { Command } = require('commander');
const { loadCommands } = require('../src/lib/load-commands');

const program = loadCommands();

/** @type {{ args: (string | Command)[] }} */
const { args } = program.parse(process.argv);

// If no command was found
if (!args.find(arg => arg instanceof Command)) {
  program.outputHelp();
}
