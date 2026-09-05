import * as http from 'http'
import restana = require('../index')

const service = restana()

service.get('/hello/:name', (req, res) => {
  res.send({ hello: req.params.name }, 200, {
    vary: ['accept', 'origin']
  })
})

http.createServer(service.callback())
service.events.on(service.events.BEFORE_ROUTE_REGISTER, (method, args) => {
  String(method)
  Array.isArray(args)
})

// TRACE is only exposed when explicitly enabled.
// @ts-expect-error
service.trace('/debug', () => {})

const traceService = restana({ enableTrace: true, trustProxy: true })
traceService.trace('/debug', (req, res) => res.send('ok'))

const configured = restana({
  debugErrors: true,
  securityHeaders: false,
  routerCacheSize: 0,
  errorHandler (err, req, res) {
    res.send({ code: err.statusCode, details: err.data })
  }
})

configured.start({ port: 3000, host: '127.0.0.1' })
