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

// Multiple middlewares can be registered at once
const auth: restana.RequestHandler<restana.Protocol.HTTP> = (req, res, next) => next()
const log: restana.RequestHandler<restana.Protocol.HTTP> = (req, res, next) => next()
service.use(auth, log)
service.use('/api', auth, log)
service.use('/nested', service.newRouter())

// Enums are available at runtime
const protocol: string = restana.Protocol.HTTP2
const method: string = restana.Method.GET
String(protocol + method)

// Nested routers require a prefix
// @ts-expect-error
service.use(service.newRouter())

// Router selection
restana({ router: 'trie', caseSensitive: false, ignoreTrailingSlash: false })
restana({ router: 'sequential', routerCacheSize: 100 })
// @ts-expect-error
restana({ router: 'radix' })
