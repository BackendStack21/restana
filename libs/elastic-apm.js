const methods = require('./methods')

module.exports = ({ apm }) => {
  return {
    patch (app) {
      methods.forEach(method => {
        const ref = app[method]

        app[method] = (path, ...args) => {
          args.unshift((req, res, next) => {
            // instrumenting APM transaction name
            apm.setTransactionName(`${method.toUpperCase()} ${path}`)

            return next()
          })

          return ref(path, args)
        }
      })
    }
  }
}
