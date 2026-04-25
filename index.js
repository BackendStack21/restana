'use strict'

/**
 * restana Web Framework implementation
 *
 * @license MIT
 */

const requestRouter = require('./libs/request-router')
const applySecurityHeaders = require('./libs/security-headers')
const exts = {
  request: {},
  response: require('./libs/response-extensions')
}

/**
 * Recursively freezes a plain object and all nested plain objects.
 * Skips arrays, Buffers, class instances, and other non-plain types.
 */
function deepFreezePlain (obj) {
  if (obj && typeof obj === 'object' && obj.constructor === Object && !Object.isFrozen(obj)) {
    Object.freeze(obj)
    for (const key of Object.keys(obj)) {
      deepFreezePlain(obj[key])
    }
  }
  return obj
}

module.exports = (options = {}) => {
  options.errorHandler =
    options.errorHandler ||
    ((err, req, res) => {
      const statusCode = typeof (err.status || err.code || err.statusCode) === 'number'
        ? (err.status || err.code || err.statusCode)
        : 500
      res.send({ code: statusCode, message: 'Internal Server Error' }, statusCode)
    })

  const server = options.server || require('http').createServer()
  const prp = undefined === options.prioRequestsProcessing ? true : options.prioRequestsProcessing
  if (prp) {
    server.on('request', (req, res) => {
      setImmediate(() => service.handle(req, res))
    })
  } else {
    server.on('request', (req, res) => {
      service.handle(req, res)
    })
  }

  const handle = (req, res) => {
    // Default security headers (can be overridden by application or disabled via options)
    if (options.securityHeaders !== false) {
      applySecurityHeaders(req, res)
    }

    // request object population
    res.send = exts.response.send(options, req, res)

    service.getRouter().lookup(req, res)
  }

  const service = handle

  const service_ = {
    errorHandler: options.errorHandler,

    newRouter () {
      return requestRouter(options)
    },

    getServer () {
      return server
    },

    getConfigOptions () {
      const copy = { ...options }
      // Deep-clone + deep-freeze nested plain objects so the user's originals
      // are not mutated as a side effect of calling getConfigOptions().
      for (const key of Object.keys(copy)) {
        const val = copy[key]
        if (val && typeof val === 'object' && !Array.isArray(val) &&
            key !== 'server' && val.constructor === Object) {
          copy[key] = deepFreezePlain(JSON.parse(JSON.stringify(val)))
        }
      }
      return Object.freeze(copy)
    },

    handle,

    start: (...args) =>
      new Promise((resolve, reject) => {
        if (!args || !args.length) args = [3000]
        server.listen(...args, (err) => {
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
      })
  }

  Object.assign(service, service_)

  // apply router capabilities
  requestRouter(options, service)

  service.callback = () => service.handle

  return service
}
