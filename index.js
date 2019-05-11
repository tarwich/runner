// @ts-check
const { log } = require('./src/log');
const { getDockerUrls } = require('./src/lib/docker');
const { runCommand } = require('./src/lib/run-command');
// Commands to export
const { build } = require('./src/commands/build');
const { clean } = require('./src/commands/clean');
const { run } = require('./src/commands/run');

module.exports = {
  commands: { build, clean, run },
  getDockerUrls,
  log,
  runCommand
};
