const next = (middlewares, req, res) => {
  const middleware = middlewares.shift()

  return (err) => {
    if (err) return res.send(err)
    if (res.statusCode === 200 && !res.finished) {
      if (!middleware) return

      try {
        const result = middleware.handler.call(
          middleware.context,
          req,
          res,
          next(middlewares, req, res)
        )
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
