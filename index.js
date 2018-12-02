/**
 * restana Web Framework implemenation
 *
 * @license MIT
 */

/**
 * importing supported HTTP methods
 */
const methods = require('./libs/methods')
/**
 * importing request router builder function
 */
const requestRouter = require('./libs/request-router')
/**
 * preparing request/response objects extensions
 */
const exts = {
  request: {},
  response: require('./libs/response-extensions')
}
/**
 * importing middlewares chain caller
 */
const next = require('./libs/middleware-chain')
/**
 * importing route handler caller
 */
const handlerCall = require('./libs/route-handler-caller')

/**
 * Application instance contructor like function
 *
 * @param options Object Configuration options
 */
module.exports = (options = {}) => {
  // create HTTP server instance
  const server = options.server || require('http').createServer()
  // register on 'request' callback
  server.on('request', (req, res) => {
    // IMPORTANT: using setImmediate here provides major performance gain
    setImmediate(() => app.handle(req, res))
  })

  // creating request router instance
  const router = requestRouter(options)
  // routes holder
  const routes = {}
  // global middlewares holder
  const middlewares = []

  const app = {
    /**
     * Register global middleware
     *
     * @param {Object} middleware  The middleware function
     * @param {Object} context The middleware invokation context object
     */
    use: (middleware, context = {}) => {
      middlewares.push({
        handler: middleware,
        context
      })
    },

    /**
     * Register a request handler.
     * Optionally the invokation context and pre-handler middlewares can be defined.
     *
     * @param {String} method HTTP method / verb
     * @param {String} path Request path
     * @param {Function} handler  Request handler function like (req, res, ctx) => {}
     * @param {Object} ctx  Optional request handler invokation context object
     * @param {Array} middlewares Optional request middlewares
     * @returns {Object} Route object
     */
    route: (method, path, handler, ctx = {}, middlewares = []) => {
      // mapping middlewares to required format { handler: Function, context: Object }
      middlewares = middlewares.map(
        middleware => (typeof middleware === 'function')
          ? { handler: middleware, context: {} }
          : middleware
      )

      // creating routing key
      const key = `[${method.toUpperCase()}]${path}`
      if (!routes[key]) {
        // caching route arguments
        routes[key] = {
          method,
          path,
          handler,
          ctx,
          middlewares
        }

        // registering request handler
        router.on(method, path, (req, res, params, route) => {
          // populate req.params
          req.params = params
          // destructing arguments
          const { handler, ctx, middlewares } = route

          if (middlewares.length > 0) {
            // call route middlewares and route handler
            next([
              ...middlewares.slice(0),
              {
                context: {},
                handler: handlerCall(handler, ctx) // -> Function
              }
            ], req, res)()
          } else {
            // directly call the route handler only
            // NOTE: we do this to increase performance
            handlerCall(handler, ctx)(req, res)
          }
        }, routes[key])
      } else {
        // update route parameters if route exist
        routes[key].ctx = ctx
        routes[key].handler = handler
        routes[key].middlewares = middlewares
      }

      return routes[key]
    },

    /**
     * Handle on 'request' event from HTTP server instance
     *
     * @param {Object} req Request object
     * @param {Object} res Response object
     */
    handle: (req, res) => {
      res.send = exts.response.send(req, res)
      if (middlewares.length > 0) {
        // call route middlewares and route handler
        next([
          ...middlewares.slice(0),
          {
            context: {},
            handler: (req, res, next) => {
              router.lookup(req, res)
            }
          }
        ], req, res)()
      } else {
        // directly call the request router
        // NOTE: we do this to increase performance
        router.lookup(req, res)
      }
    },

    /**
     * Start application HTTP server
     *
     * @param {Number} port Optional HTTP server port. Default 3000
     * @param {String} host Optional HTTP server binding network interface
     * @returns {Promise}
     */
    start: (port = 3000, host) => new Promise((resolve, reject) => {
      server.listen(port, host, (err) => {
        if (err) reject(err)
        resolve(server)
      })
    }),

    /**
     * Close application HTTP server
     *
     * @returns {Promise}
     */
    close: () => new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err)
        resolve()
      })
    }),

    /**
     * Application routes [`[${method.toUpperCase()}]${path}`]
     *
     * @returns {Array}
     */
    routes: () => Object.keys(routes)
  }

  // exposing HTTP verbs as request routing methods
  methods.forEach((method) => {
    app[method] = (path, handler, ctx, middlewares = []) => app.route(method.toUpperCase(), path, handler, ctx, middlewares)
  })

  // integrator callback
  app.callback = () => app.handle

  return app
}
