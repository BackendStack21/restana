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

// Router registration chains on the router itself
const router: restana.Router<restana.Protocol.HTTP> = service.newRouter()
  .get('/a', (req, res) => res.send('a'))
  .use(auth)
  .post('/b', (req, res) => res.send('b'))
service.use('/r', router)
const chained: restana.Service<restana.Protocol.HTTP> = service.get('/c', auth).use(log)
String(chained.id)

// Configuration snapshots are read-only
const snapshot = service.getConfigOptions()
// @ts-expect-error
snapshot.trustProxy = true
// @ts-expect-error
service.errorHandler = () => {}

// APM integrations are typed public entry points
import elasticApm = require('restana/libs/elastic-apm')
import newrelicApm = require('restana/libs/newrelic-apm')
elasticApm({ agent: { setTransactionName (name: string) { String(name) } } }).patch(service)
newrelicApm({ apm: { setTransactionName () {} } }).patch(router)
