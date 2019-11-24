/**
 * @param {*} thing The thing to check
 *
 * @returns {thing is string}
 */
function nonEmptyString(thing) {
  return typeof thing === 'string' && Boolean(thing);
}

/**
 * Typeguard to filter out undefined elements
 * @param {any} val
 */
function isDefined(val) {
  return val !== undefined && val !== null;
}

module.exports = {
  nonEmptyString,
  isDefined
};
