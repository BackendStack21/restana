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

    start: (port = 3000, host) => new Promise((resolve, reject) => {
      server.listen(port, host, (err) => {
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
      router[method].apply(router, args)

      return app
    }
  })

  app.callback = () => app.handle

  app.use(async (req, res, next) => {
    try {
      await next()
    } catch (err) {
      return app.errorHandler(err, req, res)
    }
  })

  return app
}
