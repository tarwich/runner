const https = require('https');
const http = require('http');

/**
 * Strip options from data and return options that are set in the data
 *
 * @param {object} data The object to strip
 * @param {{[key: string]: any}} options The values to look for
 */
function splitOut(data = {}, options = {}) {
  for (const key of Object.keys(options)) {
    if (key in data) options[key] = data[key];
    delete data[key];
  }

  return options;
}

/**
 * @param {string} url The url to hit
 * @param {object} options See below
 * @param {string} [options.method] The HTTP method to use (GET|POST)
 * @param {{[key: string]: any}} [options.headers] Any HTTP headers to send
 * @param {any} [options.json] Payload for a POST request
 */
function requestPromise(url, options = {}) {
  /** @type {Promise<string>} */
  return new Promise((resolve, reject) => {
    /** @type {Buffer[]} */
    const chunks = [];

    const parsedUrl = new URL(url);

    const { json } = splitOut(options, { json: false });

    if (json) {
      options.headers = Object.assign(options.headers || {}, {
        Accept: 'application/json',
      });
    }

    /** @param {Buffer} chunk The received chunk */
    const handleChunk = chunk => chunks.push(chunk);
    const end = () => {
      if (json) resolve(JSON.parse(chunks.join('')));
      else resolve(chunks.join(''));
    };

    if (parsedUrl.protocol === 'http:') {
      const request = http.request(url, options, response => {
        response.on('data', handleChunk);
        response.on('end', end);
      });
      request.on('error', reject);
      if (json) request.write(JSON.stringify(json));
      request.end();
    } else if (parsedUrl.protocol === 'https:') {
      const request = https.request(url, options, response => {
        response.on('data', handleChunk);
        response.on('end', end);
      });
      request.on('error', reject);
      if (json) request.write(JSON.stringify(json));
      request.end();
    } else {
      const error = new Error(`Protocol "${parsedUrl.protocol}" not supported`);
      reject(error);
    }
  });
}

module.exports = { requestPromise };
