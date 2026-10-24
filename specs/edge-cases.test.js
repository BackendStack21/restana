'use strict'

/* global describe, it */
const expect = require('chai').expect
const http = require('http')
const request = require('supertest')
const stream = require('stream')
const EventEmitter = require('events')
const restana = require('../index')
const getMethods = require('../libs/methods')
const securityHeaders = require('../libs/security-headers')
const { toHttpStatusCode, errorStatusCode, deepFreezeObject } = require('../libs/utils')

// Minimal server double to exercise start()/close() failure paths deterministically
class FakeServer extends EventEmitter {
  constructor ({ listen, close } = {}) {
    super()
    this.listen = listen || ((...args) => {
      this.listenArgs = args
      setImmediate(() => this.emit('listening'))
    })
    this.close = close || (cb => cb())
  }
}

// Issues a request and resolves with how the response ended
const fetchOutcome = (server, path) => new Promise(resolve => {
  const { port } = server.address()
  const req = http.get({ host: '127.0.0.1', port, path }, res => {
    res.on('data', () => {})
    res.on('end', () => resolve({ status: res.statusCode, complete: res.complete }))
    res.on('aborted', () => resolve({ status: res.statusCode, complete: false }))
    res.on('error', () => resolve({ status: res.statusCode, complete: false }))
  })
  req.on('error', err => resolve({ error: err.code }))
})

describe('Edge cases', () => {
  describe('service lifecycle', () => {
    it('listens on port 3000 when start() is called without arguments', async () => {
      const server = new FakeServer()
      const service = restana({ server })

      expect(await service.start()).to.equal(server)
      expect(server.listenArgs).to.deep.equal([3000])
      expect(server.listenerCount('error')).to.equal(0)
      expect(server.listenerCount('listening')).to.equal(0)
    })

    it('rejects start() when listen throws synchronously', async () => {
      const server = new FakeServer({
        listen () { throw new Error('invalid listen options') }
      })
      const service = restana({ server })

      let error
      await service.start({ port: -1 }).catch(err => { error = err })
      expect(error.message).to.equal('invalid listen options')
      expect(server.listenerCount('error')).to.equal(0)
      expect(server.listenerCount('listening')).to.equal(0)
    })

    it('rejects close() when the server reports an error', async () => {
      const service = restana({
        server: new FakeServer({ close: cb => cb(new Error('not running')) })
      })

      let error
      await service.close().catch(err => { error = err })
      expect(error.message).to.equal('not running')
    })

    it('rejects close() when the server throws synchronously', async () => {
      const service = restana({
        server: new FakeServer({ close () { throw new Error('close failed') } })
      })

      let error
      await service.close().catch(err => { error = err })
      expect(error.message).to.equal('close failed')
    })

    it('returns the request handler through callback()', async () => {
      const service = restana()
      service.get('/hi', (req, res) => res.send('hi'))

      expect(service.callback()).to.equal(service.handle)
      await request(http.createServer(service.callback())).get('/hi').expect(200, 'hi')
    })
  })

  describe('routers', () => {
    it('exposes find() on routers created with newRouter()', () => {
      const router = restana().newRouter()
      const handler = (req, res) => res.send('ok')
      router.get('/users/:id', handler)

      const match = router.find('GET', '/users/1')
      expect(match.handlers).to.include(handler)
      expect(match.params).to.deep.include({ id: '1' })
    })

    it('lists the base methods unless TRACE is enabled', () => {
      expect(getMethods()).to.not.include('trace')
      expect(getMethods({ enableTrace: true })).to.include('trace')
    })
  })

  describe('res.send()', () => {
    it('invokes the end callback for regular payloads', async () => {
      const service = restana()
      let callbackCalled = false
      service.get('/', (req, res) => res.send('done', 200, null, () => { callbackCalled = true }))

      const server = await service.start(0, '127.0.0.1')
      await request(server).get('/').expect(200, 'done')
      await service.close()
      expect(callbackCalled).to.equal(true)
    })

    it('fails with 500 on payloads that cannot be sent', async () => {
      const service = restana({ debugErrors: true })
      let functionCalled = false
      service.get('/symbol', (req, res) => res.send(Symbol('payload')))
      service.get('/function', (req, res) => res.send(() => { functionCalled = true }))
      service.get('/bigint', (req, res) => res.send(1n))

      const server = await service.start(0, '127.0.0.1')
      for (const type of ['symbol', 'function', 'bigint']) {
        await request(server)
          .get(`/${type}`)
          .expect('content-type', 'application/json; charset=utf-8')
          .expect(500, { code: 500, message: `Unsupported res.send() payload type: ${type}` })
      }
      await service.close()
      expect(functionCalled).to.equal(false)
    })

    it('falls back to a generic message for unknown status codes', async () => {
      const service = restana()
      service.get('/', (req, res) => res.send(Object.assign(new Error('custom'), { status: 599 })))

      const server = await service.start(0, '127.0.0.1')
      await request(server).get('/').expect(599, { code: 599, message: 'Internal Server Error' })
      await service.close()
    })

    it('caps promise resolution depth', async () => {
      const service = restana()
      // rejection reasons are not flattened, so each nesting level adds a resolution step
      const handled = (promise) => { promise.catch(() => {}); return promise }
      const chain = (depth) => {
        let promise = handled(Promise.reject(new Error('innermost')))
        for (let i = 0; i < depth; i++) promise = handled(Promise.reject(promise))
        return promise
      }

      service.get('/shallow', (req, res) => res.send(chain(1)))
      service.get('/deep', (req, res) => res.send(chain(5)))

      const server = await service.start(0, '127.0.0.1')
      await request(server).get('/shallow').expect(500, { code: 500, message: 'Internal Server Error' })
      await request(server).get('/deep').expect(500, { code: 500, message: 'Internal Server Error' })
      await service.close()
    })
  })

  describe('stream failures', () => {
    const failingAfterFirstChunk = () => new stream.Readable({
      read () {
        if (!this.sent) {
          this.sent = true
          this.push('partial')
          setTimeout(() => this.destroy(new Error('stream broke')), 20)
        }
      }
    })

    it('destroys the response when a stream fails after headers were sent', async () => {
      const service = restana()
      let callbackError
      service.get('/', (req, res) => {
        res.send(failingAfterFirstChunk(), 200, null, err => { callbackError = err })
      })

      const server = await service.start(0, '127.0.0.1')
      const outcome = await fetchOutcome(server, '/')
      await service.close()

      expect(outcome.complete).to.equal(false)
      expect(callbackError.message).to.equal('stream broke')
    })

    // fails a streamed response before any data is written, with a failing error handler
    const failEarly = async (errorHandler) => {
      let handlerCalls = 0
      let serverResponse
      const service = restana({
        errorHandler (...args) {
          handlerCalls++
          return errorHandler(...args)
        }
      })
      service.get('/', (req, res) => {
        serverResponse = res
        const failing = new stream.Readable({ read () {} })
        res.send(failing)
        setImmediate(() => failing.destroy(new Error('early failure')))
      })

      const server = await service.start(0, '127.0.0.1')
      const outcome = await fetchOutcome(server, '/')
      await service.close()

      expect(handlerCalls).to.equal(1)
      expect(serverResponse.destroyed).to.equal(true)
      // Bun flushes a 200 status once the route handler returns without ending the
      // response, so a later destroy cannot be observed as a connection reset there
      if (!process.versions.bun) expect(outcome.error).to.equal('ECONNRESET')
    }

    it('destroys the response when the error handler throws', async () => {
      await failEarly(() => { throw new Error('handler failed') })
    })

    it('destroys the response when an async error handler rejects', async () => {
      await failEarly(async () => { throw new Error('async handler failed') })
    })
  })

  describe('security headers', () => {
    const fakeResponse = (headers = {}) => ({
      headers,
      getHeader (name) { return this.headers[name] },
      setHeader (name, value) { this.headers[name] = value }
    })

    it('keeps headers set before restana handles the request', async () => {
      const service = restana()
      service.get('/', (req, res) => res.send('ok'))
      const server = http.createServer((req, res) => {
        res.setHeader('x-frame-options', 'SAMEORIGIN')
        service(req, res)
      })

      const response = await request(server).get('/').expect(200)
      expect(response.headers['x-frame-options']).to.equal('SAMEORIGIN')
      expect(response.headers['x-content-type-options']).to.equal('nosniff')
    })

    it('only trusts https as the first forwarded protocol', () => {
      const apply = securityHeaders({ trustProxy: true })
      const hsts = (proto) => {
        const res = fakeResponse()
        apply({ headers: { 'x-forwarded-proto': proto } }, res)
        return res.headers['strict-transport-security'] !== undefined
      }

      expect(hsts('https')).to.equal(true)
      expect(hsts('https, http')).to.equal(true)
      expect(hsts(' HTTPS ')).to.equal(true)
      expect(hsts(' HTTPS , http')).to.equal(true)
      expect(hsts('http, https')).to.equal(false)
      expect(hsts('httpsx')).to.equal(false)
    })

    it('ignores forwarded protocols without trustProxy and requests without headers', () => {
      const res = fakeResponse()
      securityHeaders({})({ headers: { 'x-forwarded-proto': 'https' } }, res)
      expect(res.headers['strict-transport-security']).to.equal(undefined)

      const bare = fakeResponse()
      securityHeaders({ trustProxy: true })({}, bare)
      expect(bare.headers['strict-transport-security']).to.equal(undefined)
      expect(bare.headers['x-content-type-options']).to.equal('nosniff')
    })
  })

  describe('utils', () => {
    it('coerces status codes with a default fallback', () => {
      expect(toHttpStatusCode(404)).to.equal(404)
      expect(toHttpStatusCode('404')).to.equal(500)
      expect(toHttpStatusCode(42)).to.equal(500)
      expect(toHttpStatusCode(42, 200)).to.equal(200)
    })

    it('resolves error status codes from falsy errors', () => {
      expect(errorStatusCode(undefined)).to.equal(500)
      expect(errorStatusCode(null)).to.equal(500)
      expect(errorStatusCode('boom')).to.equal(500)
      expect(errorStatusCode({ code: 'ENOENT', statusCode: 404 })).to.equal(404)
    })

    it('clones built-in values in configuration snapshots', () => {
      class Store {}
      const store = new Store()
      const original = {
        buffer: Buffer.from('secret'),
        date: new Date(0),
        pattern: /^\/api/gi,
        store
      }

      const snapshot = deepFreezeObject(original)

      expect(snapshot.buffer).to.not.equal(original.buffer)
      expect(snapshot.buffer.toString()).to.equal('secret')
      snapshot.buffer[0] = 0
      expect(original.buffer.toString()).to.equal('secret')

      expect(snapshot.date).to.not.equal(original.date)
      expect(snapshot.date.getTime()).to.equal(0)
      expect(Object.isFrozen(snapshot.date)).to.equal(true)

      expect(snapshot.pattern).to.not.equal(original.pattern)
      expect(snapshot.pattern.source).to.equal('^\\/api')
      expect(snapshot.pattern.flags).to.equal('gi')

      // class instances are kept by reference (e.g. stores, clients, loggers)
      expect(snapshot.store).to.equal(store)
      expect(Object.isFrozen(store)).to.equal(false)
    })
  })
})
