/**
 * @typedef {import('express').RequestHandler} Handler
 */

/**
 * @param {Handler} handler
 *
 * @returns {Handler}
 */
const asyncHandler = (handler) => {
  return async (req, res, next) => {
    try {
      const result = await Promise.resolve(handler(req, res, next));

      if (!res.headersSent) res.send(result);
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message || error);
    }
  };
};

module.exports = { asyncHandler };
