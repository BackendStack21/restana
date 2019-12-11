const methods = require('./methods')

/**
 * Elastic APM custom instrumentation
 *
 * Supported features:
 * - route names
 */
module.exports = ({ apm }) => {
  return {
    patch (app) {
      methods.forEach(method => {
        const ref = app[method]

        app[method] = (path, ...args) => {
          args.unshift((req, res, next) => {
            apm.setTransactionName(`${method.toUpperCase()} ${path}`)

            return next()
          })

          return ref(path, args)
        }
      })
    }
  }
}
