/**
 * Route handler caller function
 *
 * @param {Function} handler The request handler function
 * @param {Object} ctx The request handler invokation context instance
 * @param {Function} errHandler The error handler function
 */
module.exports = (handler, ctx, errHandler) => async (req, res) => {
  try {
    const result = handler.call(ctx, req, res, ctx)
    // async support
    if (result instanceof Promise) {
      const data = await result
      if (undefined !== data) {
        return res.send(data)
      }
    }
  } catch (err) {
    errHandler(err, req, res)
  }
}
