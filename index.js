'use strict'

/**
 * restana Web Framework implementation
 *
 * @license MIT
 */

const requestRouter = require('./libs/request-router')
const applySecurityHeaders = require('./libs/security-headers')
const { deepFreezeObject, toHttpStatusCode } = require('./libs/utils')
const exts = {
  request: {},
  response: require('./libs/response-extensions')
}

module.exports = (options = {}) => {
  const config = { ...options }

  config.errorHandler =
    config.errorHandler ||
    ((err, req, res) => {
      const statusCode = toHttpStatusCode(err.status || err.code || err.statusCode)
      res.send({ code: statusCode, message: 'Internal Server Error' }, statusCode)
    })

  const server = config.server || require('http').createServer()
  const prp = config.prioRequestsProcessing ?? true
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
    if (config.securityHeaders !== false) {
      applySecurityHeaders(config, req, res)
    }

    // request object population
    res.send = exts.response.send(config, req, res)

    service.getRouter().lookup(req, res)
  }

  const service = handle
  let frozenConfig = null

  const service_ = {
    errorHandler: config.errorHandler,

    newRouter () {
      return requestRouter(config)
    },

    getServer () {
      return server
    },

    getConfigOptions () {
      if (!frozenConfig) {
        const copy = { ...config }
        // Deep-clone + deep-freeze nested plain objects so the user's originals
        // are not mutated as a side effect of calling getConfigOptions().
        for (const key of Object.keys(copy)) {
          if (key !== 'server') {
            copy[key] = deepFreezeObject(copy[key])
          }
        }
        frozenConfig = Object.freeze(copy)
      }
      return frozenConfig
    },

    handle,

    start: (...args) =>
      new Promise((resolve, reject) => {
        if (!args.length) args = [3000]

        const onError = (err) => {
          server.removeListener('listening', onListening)
          reject(err)
        }
        const onListening = () => {
          server.removeListener('error', onError)
          resolve(server)
        }

        server.once('error', onError)
        server.once('listening', onListening)

        try {
          server.listen(...args)
        } catch (err) {
          server.removeListener('error', onError)
          server.removeListener('listening', onListening)
          reject(err)
        }
      }),

    close: () =>
      new Promise((resolve, reject) => {
        try {
          server.close((err) => {
            if (err) return reject(err)
            resolve()
          })
        } catch (err) {
          reject(err)
        }
      })
  }

  Object.assign(service, service_)

  // apply router capabilities
  requestRouter(config, service)

  service.callback = () => service.handle

  return service
}
