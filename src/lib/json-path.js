/**
 * @param {object} object The object to query
 * @param {string[]} path The path to traverse
 */
function jsonPath(object, path) {
  return path.reduce((item, key) => {
    return item && item[key];
  }, object);
}

module.exports = { jsonPath };
