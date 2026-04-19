'use strict'

/* global describe, it */
const expect = require('chai').expect
const request = require('supertest')
const stream = require('stream')

describe('Security Fixes', () => {
  describe('SEC-001: Default error handler does not leak internal details', () => {
    let server
    const service = require('../index')()

    service.get('/db-error', (req, res) => {
      const err = new Error('ECONNREFUSED 10.0.0.5:5432 - authentication failed for user dbadmin')
      throw err
    })

    service.get('/error-with-data', (req, res) => {
      const err = new Error('Something went wrong')
      err.data = { secret: 'internal-api-key-123', stack: 'at Module._compile' }
      throw err
    })

    service.get('/error-with-status', (req, res) => {
      const err = new Error('Not Found')
      err.status = 404
      throw err
    })

    service.get('/error-with-code', (req, res) => {
      const err = new Error('Service Unavailable')
      err.code = 503
      throw err
    })

    service.get('/error-with-statusCode', (req, res) => {
      const err = new Error('Bad Gateway')
      err.statusCode = 502
      throw err
    })

    service.get('/error-string-code', (req, res) => {
      const err = new Error('File error')
      err.code = 'ENOENT'
      throw err
    })

    it('should start service', async () => {
      server = await service.start(~~process.env.PORT)
    })

    it('should NOT leak internal error messages in default handler', async () => {
      await request(server)
        .get('/db-error')
        .expect(500)
        .then((response) => {
          expect(response.body.message).to.equal('Internal Server Error')
          expect(response.body.code).to.equal(500)
          expect(JSON.stringify(response.body)).to.not.include('ECONNREFUSED')
          expect(JSON.stringify(response.body)).to.not.include('10.0.0.5')
          expect(JSON.stringify(response.body)).to.not.include('dbadmin')
        })
    })

    it('should NOT leak error.data in default handler', async () => {
      await request(server)
        .get('/error-with-data')
        .expect(500)
        .then((response) => {
          expect(response.body.message).to.equal('Internal Server Error')
          expect(JSON.stringify(response.body)).to.not.include('internal-api-key-123')
          expect(JSON.stringify(response.body)).to.not.include('Module._compile')
        })
    })

    it('should respect error.status for HTTP status code', async () => {
      await request(server)
        .get('/error-with-status')
        .expect(404)
        .then((response) => {
          expect(response.body.code).to.equal(404)
          expect(response.body.message).to.equal('Internal Server Error')
        })
    })

    it('should respect error.code when numeric for HTTP status code', async () => {
      await request(server)
        .get('/error-with-code')
        .expect(503)
        .then((response) => {
          expect(response.body.code).to.equal(503)
        })
    })

    it('should respect error.statusCode for HTTP status code', async () => {
      await request(server)
        .get('/error-with-statusCode')
        .expect(502)
        .then((response) => {
          expect(response.body.code).to.equal(502)
        })
    })

    it('should default to 500 when error.code is a non-numeric string', async () => {
      await request(server)
        .get('/error-string-code')
        .expect(500)
        .then((response) => {
          expect(response.body.code).to.equal(500)
          expect(JSON.stringify(response.body)).to.not.include('ENOENT')
        })
    })

    it('should successfully terminate the service', async () => {
      await service.close()
    })
  })

  describe('SEC-001b: Custom error handler still receives full error details', () => {
    let server
    let capturedError = null
    const service = require('../index')({
      errorHandler (err, req, res) {
        capturedError = err
        res.send(err)
      }
    })

    service.get('/custom-error', (req, res) => {
      const err = new Error('Detailed internal error info')
      err.status = 503
      err.data = 'extra-data'
      throw err
    })

    it('should start service with custom error handler', async () => {
      server = await service.start(~~process.env.PORT)
    })

    it('should pass full error to custom handler and allow sending details (backward compat)', async () => {
      await request(server)
        .get('/custom-error')
        .expect(503)
        .then((response) => {
          // custom error handler used res.send(err), so parseErr sends message/data
          expect(response.body.message).to.equal('Detailed internal error info')
          expect(response.body.data).to.equal('extra-data')
          expect(response.body.code).to.equal(503)
          // verify the handler received the original error object
          expect(capturedError).to.be.an.instanceOf(Error)
          expect(capturedError.message).to.equal('Detailed internal error info')
        })
    })

    it('should successfully terminate the service', async () => {
      await service.close()
    })
  })

  describe('SEC-002: Stream error handling', () => {
    let server
    const service = require('../index')()

    service.get('/stream-error', (req, res) => {
      const errStream = new stream.Readable({
        read () {
          this.destroy(new Error('Stream blew up'))
        }
      })
      res.send(errStream)
    })

    service.get('/stream-ok', (req, res) => {
      const okStream = stream.Readable.from(
        (async function * () {
          yield 'Hello '
          yield 'World!'
        })()
      )
      res.setHeader('content-type', 'text/plain; charset=utf-8')
      res.send(okStream)
    })

    it('should start service', async () => {
      server = await service.start(~~process.env.PORT)
    })

    it('should handle stream errors gracefully without hanging', async () => {
      await request(server)
        .get('/stream-error')
        .then((response) => {
          // response should complete (not hang) — status may vary
          expect(response.status).to.be.a('number')
        })
    })

    it('should still handle healthy streams correctly', async () => {
      await request(server)
        .get('/stream-ok')
        .expect(200)
        .then((response) => {
          expect(response.text).to.equal('Hello World!')
        })
    })

    it('should successfully terminate the service', async () => {
      await service.close()
    })
  })

  describe('SEC-003: Immutable config options', () => {
    const service = require('../index')()

    it('getConfigOptions should return a frozen object', () => {
      const opts = service.getConfigOptions()
      expect(Object.isFrozen(opts)).to.equal(true)
    })

    it('should not allow mutation of returned config options', () => {
      const opts = service.getConfigOptions()
      expect(() => {
        opts.errorHandler = () => {}
      }).to.throw()
    })

    it('mutations on returned object should not affect internal options', () => {
      const opts1 = service.getConfigOptions()
      try { opts1.newProp = 'malicious' } catch (e) { /* frozen */ }

      const opts2 = service.getConfigOptions()
      expect(opts2.newProp).to.equal(undefined)
    })

    it('internal errorHandler should remain functional after attempted mutation', async () => {
      const opts = service.getConfigOptions()
      try { opts.errorHandler = null } catch (e) { /* frozen */ }

      // service should still have its error handler
      expect(typeof service.errorHandler).to.equal('function')
    })
  })

  describe('SEC-004: Promise recursion depth limit', () => {
    let server
    const service = require('../index')()

    service.get('/promise-simple', (req, res) => {
      res.send(Promise.resolve({ status: 'ok' }))
    })

    service.get('/promise-nested', (req, res) => {
      // Promise resolving to Promise resolving to value — depth 2
      res.send(Promise.resolve(Promise.resolve({ status: 'nested-ok' })))
    })

    service.get('/promise-deep', (req, res) => {
      // Create a very deeply nested promise chain (beyond MAX_PROMISE_DEPTH)
      let p = Promise.resolve(Promise.resolve(Promise.resolve(Promise.resolve({ status: 'too-deep' }))))
      res.send(p)
    })

    service.get('/promise-rejected', (req, res) => {
      const error = new Error('Rejected')
      error.code = 503
      res.send(Promise.reject(error))
    })

    it('should start service', async () => {
      server = await service.start(~~process.env.PORT)
    })

    it('should resolve simple promises normally', async () => {
      await request(server)
        .get('/promise-simple')
        .expect(200)
        .then((response) => {
          expect(response.body.status).to.equal('ok')
        })
    })

    it('should resolve nested promises normally within depth limit', async () => {
      await request(server)
        .get('/promise-nested')
        .expect(200)
        .then((response) => {
          expect(response.body.status).to.equal('nested-ok')
        })
    })

    it('should handle deeply nested promises without hanging', async () => {
      await request(server)
        .get('/promise-deep')
        .then((response) => {
          // should complete (not hang due to infinite recursion)
          expect(response.status).to.be.a('number')
        })
    })

    it('should still handle rejected promises correctly', async () => {
      await request(server)
        .get('/promise-rejected')
        .expect(503)
        .then((response) => {
          expect(response.body.message).to.equal('Rejected')
          expect(response.body.code).to.equal(503)
        })
    })

    it('should successfully terminate the service', async () => {
      await service.close()
    })
  })
})
