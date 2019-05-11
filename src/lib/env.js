// @ts-check
const { existsSync, readFileSync } = require('fs');

/**
 * @param {*} item The item to check
 *
 * @return {item is string[]}
 */
const isMatch = item => Array.isArray(item);

if (existsSync('.env')) {
  const text = readFileSync('.env', 'utf-8');
  const options = text
    .split('\n')
    .map(line => line.match(/^\s*(\w+)\s*=\s*(.*?)\s*$/))
    .filter(isMatch)
    .reduce((result, [_, key, value]) => ({ ...result, [key]: value }), {});
  Object.assign(process.env, options);
}
