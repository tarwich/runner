const { gatherLinters } = require('../lib/linter-manager');
const { default: chalk } = require('chalk');

const linters = gatherLinters();

/**
 * @param {string} key The key to check
 *
 * @return {key is keyof typeof linters}
 */
const isLinterEnabled = key => {
  // @ts-ignore
  return key in linters && linters[key].enabled;
};

/**
 *
 * @param {(keyof typeof linters)[] | undefined} subcommands The specified lint tasks to run. If left blank,
 * will run all of them
 */
async function run(subcommands) {
  if (!subcommands || !subcommands.length) {
    subcommands = Object.keys(linters).filter(isLinterEnabled);
  }

  /** @type {{linter: string, error: string | Error}[]} */
  const errors = [];

  const results = await Promise.all(
    subcommands.map(linter =>
      linters[linter]
        .run()
        .then(
          /** @param {string | string[]} data */
          data => {
            const output = (Array.isArray(data) ? data.join('') : data) || '';
            if (output) console.log(output);
            return { linter, success: true };
          }
        )
        .catch(error => {
          errors.push({ linter, error });
          return { linter, success: false };
        })
    )
  );

  // Show all the errors
  if (errors.length) {
    errors.forEach(({ linter, error }) => {
      console.error(`ERROR [${linter}]`.padEnd(80, '-'));
      console.error(`${error instanceof Error ? error.stack : error}\n\n`);
    });
  }

  // Show the report
  console.log(chalk.underline('\nLint Results:'));
  console.log(
    results
      .map(
        ({ linter, success }) =>
          `[${success ? chalk.green('✔') : chalk.red('X')}] ${linter}`
      )
      .join('\n')
  );
  if (errors.length) process.exit(1);
}

/**
 * @param {import('commander').Command} program The Commander instance to which
 * to add commands
 */
function install(program) {
  const subcommands = Object.keys(linters);

  program
    .command(`lint [${subcommands.join('|')}...]`)
    .description('Run lint tasks. If none specified, runs all')
    .action(subcommands => run(subcommands).catch(console.error));
}

module.exports = { install, run };
