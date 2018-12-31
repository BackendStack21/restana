/**
 * Route handler caller function
 *
 * @param {Function} handler The request handler function
 * @param {Object} ctx The request handler invokation context instance
 */
module.exports = (handler, ctx) => (req, res) => {
  try {
    const result = handler.call(ctx, req, res, ctx)
    if (result instanceof Promise) {
      // async support
      result.then(data => {
        if (undefined !== data) {
          return res.send(data)
        }
      }).catch(res.send)
    }
  } catch (err) {
    res.send(err)
  }
}
