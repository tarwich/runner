const { resolve } = require('path');
const { existsSync, readFileSync, writeFileSync } = require('fs');
const { spawnSync } = require('child_process');
const { compare, inc } = require('semver');
const { env } = process;
const { groupBy } = require('lodash');

const releaseTags = {
  breaking: 'breaking',
  feat: 'added',
  feature: 'added',
  fix: 'fixed',
  fixed: 'fixed',
  hotfix: 'hotfix',
};

const tagOrder = ['breaking', 'added', 'fixed'];

/**
 * Run a command and return the success text as a string
 *
 * @param {string} command The command to run
 * @param {string[]} args Arguments to pass
 */
function shell(command, args) {
  const child = spawnSync(command, args, {
    env,
    stdio: ['inherit', 'pipe', 'inherit'],
  });

  const text = child.stdout ? child.stdout.toString() : '';
  return text.trim();
}

/**
 * Print release notes since the last release
 *
 * @param {object} options See below
 * @param {string} options.file The file to print release notes to. If this is
 * left blank, then the release notes will be printed to STDOUT.
 * @param {boolean} options.updatePackage Update the package.json
 */
async function run(options) {
  const tags = shell('git', ['tag', '-l']);
  const [currentVersion = 'HEAD'] = tags
    .split('\n')
    .sort(compare)
    .slice(-1);
  const currentVersionHash = shell('git', ['rev-parse', currentVersion]);
  const logs = shell('git', [
    'log',
    '--pretty=%B',
    `${currentVersionHash}...HEAD`,
  ])
    .split('\n')
    .map(line => {
      const [, tag = '', message = ''] =
        line.match(/^\s*(\w+?)\s*:\s*(.*)\s*$/) || [];
      return {
        // @ts-ignore
        tag: releaseTags[tag],
        message: message,
      };
    })
    .filter(note => note.tag)
    .sort((a, b) => {
      const aa = tagOrder.indexOf(a.tag);
      const bb = tagOrder.indexOf(b.tag);
      return aa > bb ? 1 : aa < bb ? -1 : 0;
    });
  const groups = groupBy(logs, 'tag');
  const topGroup = Object.keys(groups)[0];
  const newVersion = inc(
    currentVersion,
    // @ts-ignore
    {
      breaking: 'major',
      added: 'minor',
      fixed: 'patch',
    }[topGroup]
  );
  const text =
    `# ${newVersion}\n\n` +
    Object.entries(groups)
      .map(
        ([groupName, group]) =>
          `## ${groupName.replace(/(\w)/, c => c.toUpperCase())}\n` +
          group
            .map(({ tag, message }) => ` * [${tag.toUpperCase()}]: ${message}`)
            .join('\n')
      )
      .join('\n\n');

  if (options.updatePackage) {
    const pkg = require(resolve('package.json'));
    pkg.version = newVersion;
    writeFileSync(resolve('package.json'), JSON.stringify(pkg, null, '  '));
  }
  if (options.file) {
    const file = resolve(options.file);
    const previousText = existsSync(file) ? readFileSync(file) : '';
    writeFileSync(file, `${text}\n\n${previousText}`.trim());
  } else console.log(text);
}

/**
 * @param {import('commander').Command} program The Commander instance to which
 * to add this command
 */
function install(program) {
  program
    .command('release-notes')
    .description('Print the release notes since the last release')
    .option('--file <file>', 'Write the release notes to the specified file')
    .option('--update-package', 'Update the package.json with the new version')
    .action(options => run(options).catch(console.error));
}

module.exports = { install };
