/**
 * @param {*} thing The thing to check
 *
 * @returns {thing is string}
 */
function nonEmptyString(thing) {
  return typeof thing === 'string' && Boolean(thing);
}

module.exports = {
  nonEmptyString,
};
