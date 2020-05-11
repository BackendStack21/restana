'use strict'

/**
 * @see: https://github.com/jkyberneees/0http#0http---sequential-default-router
 */
const sequential = require('0http/lib/router/sequential')

module.exports = (options) => {
  const router = sequential({
    errorHandler: options.errorHandler,
    cacheSize: options.routerCacheSize || 2000,
    defaultRoute: options.defaultRoute || ((req, res) => {
      res.send(404)
    })
  })

  return router
}
