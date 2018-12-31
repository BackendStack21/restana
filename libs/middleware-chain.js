/**
 * Middlewares chain invoker function
 *
 * @param {Array} middlewares
 * @param {Object} req
 * @param {Object} res
 */
const next = (middlewares, req, res) => {
  // retrieve next middleware from chain
  const middleware = middlewares.shift()

  return (err) => {
    if (err) return res.send(err)
    if (res.statusCode === 200 && !res.finished) {
      if (!middleware) return

      try {
        // invoke each middleware
        const result = middleware.handler.call(middleware.context, req, res, next(middlewares, req, res))
        if (result instanceof Promise) {
          // async support
          result.catch(res.send)
        }
      } catch (err) {
        res.send(err)
      }
    } else if (!res.finished) {
      res.send(res.statusCode)
    }
  }
}

module.exports = next
