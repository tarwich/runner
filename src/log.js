/**
 * Log a message in the name of the module
 *
 * @param {string} module The name of the module the log belongs to
 * @param {string} message The message of the log statement
 */
const log = (module, message = '') => {
  if (!message.trim()) return;
  console.log(`[${module}] ${message}`.trim());
};

const exit = (module = '', message = 'done') => () => {
  log(module, message);
  process.exit();
};

module.exports = { exit, log };
