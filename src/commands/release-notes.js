const { resolve } = require('path');
const { existsSync, readFileSync, writeFileSync } = require('fs');
const { spawnSync } = require('child_process');
const { inc } = require('semver');
const { env } = process;
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
 * @return {{version: string, hash: string}} The current version string and the
 * hash for this version to be used in git commit comparison
 */
function getCurrentVersion() {
  const pkg = require(resolve('package.json'));

  const { version = '0.0.1' } = pkg;
  const hash =
    shell('git', ['rev-list', '-1', version]) ||
    shell('git', ['rev-list', '--max-parents=0', 'HEAD']);

  return { version: version, hash };
}

/**
 * @param {_.Dictionary<{ tag: "breaking" | "added" | "fixed" | "task"; message: string; }[]>} groups
 */
function getReleaseType(groups) {
  if ('breaking' in groups) return 'major';
  if ('added' in groups) return 'minor';
  return 'patch';
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
  const {
    version: currentVersion,
    hash: currentVersionHash,
  } = getCurrentVersion();
  const logs = shell('git', [
    'log',
    '--pretty=%B',
    `${currentVersionHash}...HEAD`,
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
  const releaseType = getReleaseType(groups);
  const newVersion = releaseType && inc(currentVersion, releaseType);
  if (!newVersion) {
    console.error('Unable to determine next version', {
      currentVersion,
      currentVersionHash,
    });
    process.exit(1);
    return;
  }
  // Build the release notes
  const text =
    `# ${newVersion}\n\n` +
    tagOrder
      // Remove tags that don't exist in the current output
      .filter(groupName => groups[groupName])
      .map(groupName => {
        const group = groups[groupName];
        return (
          `## ${groupName.replace(/(\w)/, c => c.toUpperCase())}\n` +
          group
            .map(
              ({ tag, message }) => ` * [\`${tag.toUpperCase()}\`]: ${message}`
            )
            .join('\n')
        );
      })
      .join('\n\n');

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
  // Output the notes to the console or a file
  if (options.file) {
    const file = resolve(options.file);
    const previousText = existsSync(file) ? readFileSync(file) : '';
    writeFileSync(file, `${text}\n\n${previousText}`.trim());
  } else console.log(text);

  shell('git', ['commit', '-am', `Release ${newVersion}`]);
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

module.exports = { install };
