require('../lib/env');
const requestPromise = require('request-promise-native');
const { jsonPath } = require('../lib/json-path');
const { readFileSync } = require('fs');
const { buildReleaseNotes } = require('../commands/release-notes');

const { GITHUB_REF, GITHUB_REPOSITORY = '', GITHUB_TOKEN } = process.env;

/**
 * @param {string} query The GQL query to run
 * @param {object} [variables] JSON variable information for the request
 */
const gql = async (query, variables) => {
  return requestPromise('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'tarwich',
    },
    json: { query, variables },
  });
};

async function main() {
  // Only run on master branch
  if (GITHUB_REF !== 'refs/heads/master') {
    console.log('Not on master branch');
    process.exit(0);
  }

  const [OWNER, REPOSITORY] = GITHUB_REPOSITORY.split('/');
  const { version } = JSON.parse(readFileSync('package.json', 'utf-8'));

  const release = jsonPath(
    await gql(`query {
    repository(owner:"${OWNER}" name:"${REPOSITORY}") {
      release(tagName:"${version}") {
        id name description
      }
    }
  }`),
    ['data', 'repository', 'release']
  );

  if (release) {
    console.log(`Release for "${version}" already created. Ignoring.`);
    return;
  }

  const notes = `## ${version}\n\n${buildReleaseNotes('HEAD')}`;
  const result = await requestPromise(
    `https://api.github.com/repos/${OWNER}/${REPOSITORY}/releases`,
    {
      headers: {
        Authorization: `bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'tarwich',
      },
      method: 'POST',
      json: {
        tag_name: version,
        target_commitish: process.env.GITHUB_REF,
        name: version,
        body: notes,
      },
    }
  );

  console.log(require('util').inspect(result, { depth: 10 }));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
