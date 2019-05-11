const { spawnSync } = require('child_process');
/**
 * Run a command and return the success text as a string
 *
 * @param {string} command The command to run
 * @param {string[]} args Arguments to pass
 */
function shell(command, args) {
  const { stdout } = spawnSync(command, args, {
    env: process.env,
    stdio: ['inherit', 'pipe', 'inherit'],
  });
  const text = stdout ? stdout.toString() : '';
  return text.trim();
}
exports.shell = shell;
