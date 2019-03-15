const globby = require('globby');

class LintCommands {
  static checkTypes() {
    console.log('CHECK TYPES');
  }
}

/**
 *
 * @param {keyof typeof LintCommands | undefined} subcommands The specified lint tasks to run. If left blank,
 * will run all of them
 */
async function run(subcommands) {
  const commands = (subcommands && subcommands.length)
    ? subcommands
    : Object.keys(LintCommands)
  ;

  for (const subcommand of commands) {
    const method = LintCommands[subcommand];
    await method();
  }
}

/**
 * @param {import('commander').Command} program The Commander instance to which
 * to add commands
 */
function install(program) {
  program.command('lint [subcommands...]')
  .description('Run lint tasks. If none specified, runs all')
  .action(subcommands => run(subcommands).catch(console.error));
}

module.exports = { install, run };
