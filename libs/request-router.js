/**
 * find-my-way router factory
 *
 * @see https://github.com/delvedor/find-my-way
 */
const sequential = require('0http/lib/router/sequential')

module.exports = (options) => {
  const router = sequential({
    cacheSize: options.routerCacheSize || 2000,
    defaultRoute: options.defaultRoute || ((req, res) => {
      res.send(404)
    })
  })

  router._use = router.use

  router.use = (prefix, ...middlewares) => {
    if (typeof prefix === 'function') {
      middlewares = prefix
      prefix = '/'
    }
    router._use(prefix, middlewares)

    return this
  }

  return router
}
