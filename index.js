'use strict'

/**
 * restana Web Framework implementation
 *
 * @license MIT
 */

const shortcuts = ['get', 'delete', 'patch', 'post', 'put', 'head', 'options', 'trace', 'all']
const requestRouter = require('./libs/request-router')
const exts = {
  request: {},
  response: require('./libs/response-extensions')
}

module.exports = (options = {}) => {
  options.errorHandler = options.errorHandler || ((err, req, res) => {
    res.send(err)
  })

  const routes = new Set()
  const router = requestRouter(options)
  const server = options.server || require('http').createServer()
  const prp = undefined === options.prioRequestsProcessing ? true : options.prioRequestsProcessing
  if (prp) {
    server.on('request', (req, res) => {
      setImmediate(() => app.handle(req, res))
    })
  } else {
    server.on('request', (req, res) => {
      app.handle(req, res)
    })
  }

  const app = {
    routes () {
      return [...routes]
    },

    getRouter () {
      return router
    },

    errorHandler: options.errorHandler,

    newRouter () {
      return requestRouter(options)
    },

    getServer () {
      return server
    },

    getConfigOptions () {
      return options
    },

    use: (...args) => {
      router.use.apply(router, args)

      return app
    },

    handle: (req, res) => {
      // request object population
      res.send = exts.response.send(options, req, res)

      router.lookup(req, res)
    },

    start: (...args) => new Promise((resolve, reject) => {
      if (!args || !args.length) args = [3000]
      server.listen(...args, (err) => {
        if (err) reject(err)
        resolve(server)
      })
    }),

    close: () => new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err)
        resolve()
      })
    })

  }

  shortcuts.forEach((method) => {
    app[method] = (...args) => {
      routes.add(`${method.toUpperCase()}${args[0]}`)
      router[method].apply(router, args)

      return app
    }
  })

  app.callback = () => app.handle

  app.use(async (req, res, next) => {
    try {
      await next()
    } catch (err) {
      return options.errorHandler(err, req, res)
    }
  })

  return app
}
