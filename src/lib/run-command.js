const { loadCommands } = require('./load-commands');

/**
 * Run a command as if it were run on the cli
 *
 * @param {string} command The command to run
 * @param {string[]} args Any arguments to be passed to the command as if passed
 * on the cli
 */
function runCommand(command, args = []) {
  const program = loadCommands();
  program.parse([command, ...args]);
}

module.exports = { runCommand };
