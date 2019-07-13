/**
 * Middlewares chain invoker function
 *
 * @param {Array} middlewares
 * @param {Object} req
 * @param {Object} res
 * @param {Function} errorHandler
 */
function next(middlewares, req, res, errorHandler, middlewareIndex = 0) {
  // retrieve next middleware from chain
  const middleware = middlewares[middlewareIndex];

  function step(err) {
    if (err) return errorHandler(err, req, res)
    if (res.statusCode === 200 && !res.finished) {
      if (!middleware) return

      return next(middlewares, req, res, errorHandler, ++middlewareIndex)
    } else if (!res.finished) {
      res.send(res.statusCode)
    }
  }

  try {
    return middleware.handler.call(middleware.context, req, res, step)
  }
  catch (e) {
    errorHandler(e, req, res)
  }
}



module.exports = next