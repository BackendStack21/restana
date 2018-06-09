const methods = ['get', 'delete', 'patch', 'post', 'put', 'head', 'options']
const exts = {
  request: {},
  response: require('./libs/response-extensions')
}
const reqHandler = require('./libs/middleware-chain')

module.exports = (options = {}) => {
  const server = options.server || require('http').createServer()
  server.on('request', (req, res) => {
    setImmediate(() => app.handler(req, res))
  })

  const router = require('find-my-way')({
    ignoreTrailingSlash: options.ignoreTrailingSlash || false,
    allowUnsafeRegex: options.allowUnsafeRegex || false,
    maxParamLength: options.maxParamLength || 100,
    defaultRoute: (req, res) => {
      res.send(404)
    }
  })

  const routes = {}
  const middlewares = []

  const app = {
    use: (middleware, context = {}) => {
      middlewares.push({
        handler: middleware,
        context
      })
    },
    route: (method, path, handler, ctx = {}) => {
      const key = `[${method.toUpperCase()}]${path}`
      if (!routes[key]) {
        routes[key] = {
          method,
          path,
          handler,
          ctx
        }

        router.on(method, path, (req, res, params) => {
          try {
            req.params = params
            let {handler, ctx} = routes[key]
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
        })
      } else {
        routes[key].ctx = ctx
        routes[key].handler = handler
      }

      return routes[key]
    },
    handler: (req, res) => {
      res.send = exts.response.send(req, res)
      // calling middlewares
      if (middlewares.length) {
        reqHandler([
          ...middlewares.slice(0),
          {
            context: {},
            handler: (req, res, next) => {
              router.lookup(req, res)
            }
          }
        ],
        req,
        res
        )()
      } else {
        router.lookup(req, res)
      }
    },
    start: (port = 3000, host) =>
      new Promise((resolve, reject) => {
        server.listen(port, host, (err) => {
          if (err) reject(err)
          resolve(server)
        })
      }),
    close: () =>
      new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err)
          resolve()
        })
      }),
    routes: () => Object.keys(routes)
  }

  methods.forEach((method) => {
    app[method] = (path, handler, ctx) => app.route(method.toUpperCase(), path, handler, ctx)
  })

  return app
}
