'use strict'

/**
 * @see: https://github.com/jkyberneees/0http#0http---sequential-default-router
 */
const sequential = require('0http/lib/router/sequential')
const methods = require('./methods')

module.exports = (options, service = {}) => {
  const routes = new Set()

  const router = sequential({
    errorHandler: options.errorHandler,
    cacheSize: options.routerCacheSize || 2000,
    defaultRoute: options.defaultRoute || ((req, res) => {
      res.send(404)
    })
  })

  // attach router id
  service.id = router.id

  // attach use method
  service.use = (...args) => {
    router.use.apply(router, args)

    return service
  }

  // attach routes registration shortcuts
  methods.forEach((method) => {
    service[method] = (...args) => {
      if (Array.isArray(args[0])) {
        // support multiple paths registration
        const argsExceptPath = args.slice(1)

        // for arch path
        args[0].forEach(urlPath => {
          const singleRouteArgs = [...argsExceptPath]
          singleRouteArgs.unshift(urlPath)

          routes.add(`${method.toUpperCase()}${singleRouteArgs[0]}`)
          router[method].apply(router, singleRouteArgs)
        })
      } else {
        routes.add(`${method.toUpperCase()}${args[0]}`)
        router[method].apply(router, args)
      }

      return service
    }
  })

  // attach router
  service.getRouter = () => router

  // attach routes
  service.routes = () => [...routes]

  // attach lookup and find methods if not main service
  if (!service.handle) {
    service.lookup = (...args) => router.lookup.apply(router, args)
    service.find = (...args) => router.find.apply(router, args)
  }

  return service
}
