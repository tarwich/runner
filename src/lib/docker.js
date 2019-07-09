const { log } = require('../log');
const { spawnSync } = require('child_process');
const { sync: globSync } = require('glob');
const { resolve } = require('path');
const { compareTwoStrings } = require('string-similarity');

const { env } = process;

/** @type {{
 *   [key: string]: {
 *     name: string;
 *     ports: {host: string, container: string}[];
 *     hostPorts: string[];
 *     containerPorts: string[];
 *   }
 * }} */
let dockerProcesses;

/**
 * @template T inferred
 * @param {T | undefined} input
 * @return {input is Exclude<T, undefined | null | '' | false | 0>}
 */
function isTruthy(input) {
  return Boolean(input);
}

async function getDockerUrls() {
  if (!globSync(resolve('docker-compose.yml')).length) {
    env.DOCKER = 'ignore';
    log('docker', 'No docker-compose.yml. Not running docker');
    return;
  }

  if (env.DOCKER) return env.DOCKER;

  log('docker', 'Boot docker');
  log('docker', String(spawnSync('docker-compose', ['up', '-d']).stderr));

  log('docker', 'Get docker ports');
  const shell = spawnSync('docker-compose', ['ps']);
  log('docker', String(shell.stderr));

  const processes = await getDockerProcesses();

  if (!processes) return;

  const replaced = replaceEnvVars(processes);
  console.log(replaced);

  env.DOCKER = 'done';
}

/**
 * @param {typeof dockerProcesses} processes
 */
function replaceEnvVars(processes) {
  const toReplace = Object.keys(process.env).filter(envKey =>
    /_URL$/.test(envKey)
  );

  toReplace.forEach(envKey => {
    const envValue = process.env[envKey] || '';
    const envTag = envKey.replace(/_URL$/, '').toLowerCase();
    const [, envPort = ''] = envValue.match(/:(\d+)/) || [];

    const candidates = Object.values(processes)
      .map(process => {
        const port = process.ports.find(port => port.container === envPort);
        if (!port) return null;
        const similarity = compareTwoStrings(envTag, process.name);

        return { ...process, port, similarity };
      })
      .filter(isTruthy)
      .sort(
        (a, b) => b.similarity - a.similarity || a.name.length - b.name.length
      );

    const winner = candidates[0];

    if (winner) {
      process.env[envKey] = envValue.replace(envPort, winner.port.host);
    }
  });

  return toReplace.reduce((result, key) => {
    return {
      ...result,
      [key]: process.env[key],
    };
  }, {});
}

async function getDockerProcesses() {
  if (!globSync(resolve('docker-compose.yml')).length) {
    env.DOCKER = 'ignore';
    log('docker', 'No docker-compose.yml. Not running docker');
    return;
  }

  if (dockerProcesses) return dockerProcesses;

  log('docker', 'Boot docker');
  log('docker', String(spawnSync('docker-compose', ['up', '-d']).stderr));

  log('docker', 'Get docker ports');
  const shell = spawnSync('docker-compose', ['ps']);
  log('docker', String(shell.stderr));

  return parseDockerPs(String(shell.stdout));
}

/**
 *
 * @param {string} psString
 * @return {typeof dockerProcesses}
 */
function parseDockerPs(psString = '') {
  return (psString.match(/^\w+.*:\d+->\d+/gm) || []).reduce((results, line) => {
    const [, name = ''] = line.match(/^.*?_(.+?)_/) || [];
    const ports = (line.match(/:\d+->\d+/g) || []).map(match => {
      const [host = '', container = ''] = match.match(/\d+/g) || [];
      return { host, container };
    });

    return {
      ...results,
      [name]: {
        name,
        ports,
        hostPorts: ports.map(port => port.host),
        containerPorts: ports.map(port => port.container),
      },
    };
  }, {});
}

module.exports = {
  getDockerProcesses,
  getDockerUrls,
  parseDockerPs,
  replaceEnvVars,
};
