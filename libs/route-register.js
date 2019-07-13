/**
 * Route registration handler
 *
 * @param {Object} app The restana service instance
 * @param {String} methods The request method, i.e: GET, POST...
 * @param {String} path The request path, i.e: /users/1
 * @param {Array} args The route registration arguments. Includes the handler and it's calling context, plus optional route level middlewares
 */
module.exports = (app, methods, path, args) => {
  let ctx = {}
  const middlewares = []

  // sanitazing HTTP methods
  if (Array.isArray(methods)) {
    methods = methods.map(method => method.toUpperCase())
  } else {
    methods = methods.toUpperCase()
  }

  // try handler as last element of the array
  let handler = args.pop()

  if (Array.isArray(handler) && handler.length && typeof handler[0] === 'function') {
    // route middlewares are remaining elements
    middlewares.push(...handler)
    // handler is fist element
    handler = args.shift()
    // ctx is second element
    ctx = args.shift()
  } else if (typeof handler !== 'function') {
    // last element is not a function, should be handler ctx
    ctx = handler
    // route handler is remaining element
    handler = args.pop()
  }

  if (!middlewares.length) {
    // route middlewares are remaining elements
    middlewares.push(...args)
  }

  // register route
  app.route(methods, path, handler, ctx, middlewares)
}
