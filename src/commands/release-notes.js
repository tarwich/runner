const { shell } = require('../lib/shell');
const { resolve } = require('path');
const { existsSync, readFileSync, writeFileSync } = require('fs');
const { inc, compare } = require('semver');
const { groupBy, uniq, upperFirst } = require('lodash');

/** @type {{[key: string]: 'breaking' | 'added' | 'fixed' | 'task'}} */
const releaseTags = {
  breaking: 'breaking',

  feat: 'added',
  feature: 'added',
  added: 'added',

  fix: 'fixed',
  fixed: 'fixed',
  hotfix: 'fixed',

  task: 'task',
};

const tagOrder = uniq(Object.values(releaseTags));

/**
 * @param {string} notes
 */
function getReleaseType(notes) {
  const groups = notes
    .toLowerCase()
    .split('\n')
    .map(line => (line.match(/## (\w+)/) || [])[1])
    .filter(Boolean);
  if (groups.includes('breaking')) return 'major';
  if (groups.includes('added')) return 'minor';
  return 'patch';
}

/**
 * @param {string} forVersion The version to build the release notes for
 *
 * @return {string}
 */
function buildReleaseNotes(forVersion) {
  const tags = shell('git', ['tag', '--list'])
    .split('\n')
    .sort(compare);
  const previousVersion =
    tags[
      (tags.includes(forVersion) ? tags.indexOf(forVersion) : tags.length) - 1
    ];

  const currentVersionHash = shell('git', ['rev-list', '-1', forVersion]);
  const previousVersionHash =
    shell('git', ['rev-list', '-1', previousVersion]) ||
    shell('git', ['rev-list', '--max-parents=0', 'HEAD']);

  const logs = shell('git', [
    'log',
    '--pretty=%B',
    `${previousVersionHash}...${currentVersionHash}`,
  ])
    .split('\n')
    // Convert the lines into an array of tag and message objects
    .map(line => {
      const [, tag = '', message = ''] =
        line.match(/^\s*(\w+?)\s*:\s*(.*)\s*$/) || [];
      return {
        tag: releaseTags[tag.toLowerCase()],
        message: upperFirst(message),
      };
    })
    // Remove lines that do not contain a known tag
    .filter(note => note.tag);
  const groups = groupBy(logs, 'tag');
  // Build the release notes
  const text = tagOrder
    // Remove tags that don't exist in the current output
    .filter(groupName => groups[groupName])
    .map(groupName => {
      const group = groups[groupName];
      return (
        `## ${groupName.replace(/(\w)/, c => c.toUpperCase())}\n\n` +
        group
          .map(({ tag, message }) => `- [\`${tag.toUpperCase()}\`]: ${message}`)
          .join('\n')
      );
    })
    .join('\n\n');
  return text;
}

/**
 * Print release notes since the last release
 *
 * @param {object} options See below
 * @param {string} options.file The file to print release notes to. If this is
 * left blank, then the release notes will be printed to STDOUT.
 * @param {boolean} options.updatePackage Update the package.json
 * @param {boolean} options.tag True if a git tag should be created
 */
async function run(options) {
  // Pull in any tags
  shell('git', ['fetch', '--tags']);
  // Get the current version
  const pkg = require(resolve('package.json'));
  const { version: currentVersion = '0.0.1' } = pkg;

  const notes = buildReleaseNotes('HEAD');
  const releaseType = getReleaseType(notes);
  const newVersion = releaseType && inc(currentVersion, releaseType);
  if (!newVersion) {
    console.error('Unable to determine next version', { currentVersion });
    process.exit(1);
    return;
  }

  // Create the tag if we were told to do so
  if (options.tag) {
    shell('git', ['tag', '-a', newVersion, '-m', `Release ${newVersion}`]);
  }
  // Update package.json if we were told to do so
  if (options.updatePackage) {
    const pkg = require(resolve('package.json'));
    pkg.version = newVersion;
    writeFileSync(
      resolve('package.json'),
      JSON.stringify(pkg, null, '  ') + '\n'
    );
  }
  const text = `## ${newVersion}\n\n${notes}`;

  // Output the notes to the console or a file
  if (options.file) {
    const file = resolve(options.file);
    const previousText = existsSync(file) ? readFileSync(file) : '';
    writeFileSync(file, `${text}\n\n${previousText}`.trim() + '\n');
    // Commit the changes
    shell('git', ['commit', '-am', `Release ${newVersion}`]);
    // Show information about the release
    console.log(shell('git', ['-P', 'log', '-n', '1', '-p']));
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
    .option('--tag', 'Create a git tag')
    .action(options => run(options).catch(console.error));
}

module.exports = { install, buildReleaseNotes, getReleaseType };
