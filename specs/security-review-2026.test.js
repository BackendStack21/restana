'use strict'

/* global describe, it, before, after */
const expect = require('chai').expect
const request = require('supertest')
const http = require('http')

//
//  Security Review — April 2026
//
//  These tests assert the DESIRED secure behavior. They fail against the current
//  codebase because the corresponding vulnerabilities have not yet been fixed.
//  Each test maps to a finding from the security audit.
//

describe('Security Review — April 2026', () => {
  // ──────────────────────────────────────────────────────
  // SEC-H-001: Response Header Injection Prevention
  // ──────────────────────────────────────────────────────
  describe('SEC-H-001: Response header injection prevention', () => {
    describe('SEC-H-001a: forbidden header keys are blocked', () => {
      let server
      const service = require('../index')()

      service.get('/inject-transfer-encoding', (req, res) => {
        res.send('ok', 200, { 'transfer-encoding': 'chunked' })
      })

      service.get('/inject-content-length', (req, res) => {
        res.send('ok', 200, { 'content-length': '999' })
      })

      it('should start service', async () => {
        server = await service.start(0)
      })

      it('should NOT allow overriding transfer-encoding via headers param', async () => {
        const res = await request(server)
          .get('/inject-transfer-encoding')
          .expect(200)

        expect(res.text).to.equal('ok')
        // transfer-encoding is a hop-by-hop header managed by Node internals
        // Users should not be able to inject it via res.send()
        expect(res.headers['transfer-encoding']).to.not.equal('chunked')
      })

      it('should NOT allow overriding content-length via headers param', async () => {
        const res = await request(server)
          .get('/inject-content-length')
          .expect(200)

        expect(res.text).to.equal('ok')
        // content-length should reflect the actual body size (2 bytes: "ok")
        expect(res.headers['content-length']).to.equal('2')
      })

      it('should successfully terminate the service', async () => {
        await service.close()
      })
    })

    describe('SEC-H-001b: arbitrary set-cookie injection is blocked', () => {
      let server
      const service = require('../index')()

      service.get('/inject-set-cookie', (req, res) => {
        res.send('ok', 200, { 'set-cookie': 'sessionid=malicious' })
      })

      it('should start service', async () => {
        server = await service.start(0)
      })

      it('should NOT allow arbitrary set-cookie injection via headers param', async () => {
        const res = await request(server)
          .get('/inject-set-cookie')
          .expect(200)

        expect(res.text).to.equal('ok')
        // set-cookie should not be injectable from user-controlled headers param
        expect(res.headers['set-cookie']).to.equal(undefined)
      })

      it('should successfully terminate the service', async () => {
        await service.close()
      })
    })

    describe('SEC-H-001c: invalid header key characters handled gracefully', () => {
      let server
      const service = require('../index')()

      // CRLF injection attempt in header key
      service.get('/inject-crlf-key', (req, res) => {
        res.send('ok', 200, { 'content-type\r\nx-injected': 'value' })
      })

      // Newline injection attempt in header key
      service.get('/inject-newline-key', (req, res) => {
        res.send('ok', 200, { 'content-type\nx-injected': 'value' })
      })

      // Array value in headers (could cause header duplication issues)
      service.get('/inject-array-header', (req, res) => {
        res.send('ok', 200, { 'set-cookie': ['session=malicious', 'token=evil'] })
      })

      it('should start service', async () => {
        server = await service.start(0)
      })

      it('should handle CRLF in header keys without crashing and return 200', async () => {
        const res = await request(server)
          .get('/inject-crlf-key')
          .expect(200)

        expect(res.text).to.equal('ok')
      })

      it('should handle newline in header keys without crashing and return 200', async () => {
        const res = await request(server)
          .get('/inject-newline-key')
          .expect(200)

        expect(res.text).to.equal('ok')
      })

      it('should sanitize array header values to prevent header injection', async () => {
        const res = await request(server)
          .get('/inject-array-header')
          .expect(200)

        expect(res.text).to.equal('ok')
        // Array values in headers should not be blindly applied
        // set-cookie header must not be injectable via the headers param
        expect(res.headers['set-cookie']).to.equal(undefined)
      })

      it('should successfully terminate the service', async () => {
        await service.close()
      })
    })
  })

  // ──────────────────────────────────────────────────────
  // SEC-M-01: TRACE Method Disabled by Default
  // ──────────────────────────────────────────────────────
  describe('SEC-M-01: TRACE method disabled by default', () => {
    it('should NOT have trace method on service (TRACE is unnecessary attack surface)', () => {
      const service = require('../index')()

      // trace should not be a registered method handler
      expect(service.trace).to.equal(undefined)
    })

    it('should NOT allow registering TRACE routes', () => {
      const service = require('../index')()

      // Calling service.trace() should throw or be a no-op
      expect(() => service.trace('/debug', (req, res) => res.send('echo'))).to.throw()
    })

    it('TRACE routes should not appear in service route listing', () => {
      const service = require('../index')()
      // service.trace is undefined — TRACE routes cannot be registered
      const routes = service.routes()

      // No TRACE routes should exist
      const traceRoutes = routes.filter(r => r.startsWith('TRACE'))
      expect(traceRoutes).to.have.lengthOf(0)
    })
  })

  // ──────────────────────────────────────────────────────
  // SEC-M-01b: TRACE Method Opt-In via enableTrace
  // ──────────────────────────────────────────────────────
  describe('SEC-M-01b: TRACE method available via enableTrace option', () => {
    it('should expose trace method when enableTrace: true', () => {
      const service = require('../index')({ enableTrace: true })

      expect(service.trace).to.be.a('function')
    })

    it('should allow registering and serving TRACE routes when enabled', async () => {
      const service = require('../index')({ enableTrace: true })
      const server = await service.start(0)

      service.trace('/debug', (req, res) => {
        res.send('trace-ok')
      })

      const res = await require('supertest')(server)
        .trace('/debug')
        .expect(200)

      expect(res.text).to.equal('trace-ok')
      await service.close()
    })

    it('TRACE routes should appear in service route listing when enabled', () => {
      const service = require('../index')({ enableTrace: true })

      service.trace('/debug', (req, res) => res.send('echo'))
      const routes = service.routes()

      expect(routes.includes('TRACE/debug')).to.equal(true)
    })
  })

  // ──────────────────────────────────────────────────────
  // SEC-M-02: Error Message Suppression in Production
  // ──────────────────────────────────────────────────────
  describe('SEC-M-02: error details not leaked in production mode', () => {
    let server
    let productionService
    let originalEnv

    // Create a service configured for production-like behavior
    before(() => {
      originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      productionService = require('../index')({
        errorHandler (err, req, res) {
          // Custom handler that sends the error object explicitly
          // In production, this should NOT leak internal details
          res.send(err)
        }
      })

      productionService.get('/leak', (req, res) => {
        const err = new Error('ECONNREFUSED database.internal:5432')
        err.code = 502
        err.data = { internalIp: '10.0.0.5', query: 'SELECT * FROM users' }
        throw err
      })
    })

    after(() => {
      process.env.NODE_ENV = originalEnv
    })

    it('should start production service', async () => {
      server = await productionService.start(0)
    })

    it('should NOT expose internal error messages in production', async () => {
      const res = await request(server)
        .get('/leak')
        .expect(502)

      // In production, the actual error message must be masked
      expect(res.body.message).to.equal('Internal Server Error')
      expect(res.body.message).to.not.include('ECONNREFUSED')
      expect(res.body.message).to.not.include('database.internal')
    })

    it('should NOT expose error.data in production', async () => {
      const res = await request(server)
        .get('/leak')
        .expect(502)

      // Internal data attached to the error should not be serialized
      expect(res.body).to.not.have.property('data')
      expect(JSON.stringify(res.body)).to.not.include('10.0.0.5')
    })

    it('should successfully terminate the production service', async () => {
      await productionService.close()
    })
  })

  // ──────────────────────────────────────────────────────
  // SEC-M-04: Default Security Headers
  // ──────────────────────────────────────────────────────
  describe('SEC-M-04: security headers set by default', () => {
    let server
    const service = require('../index')()

    service.get('/hello', (req, res) => {
      res.send('world')
    })

    it('should start service', async () => {
      server = await service.start(0)
    })

    it('should set X-Content-Type-Options: nosniff by default', async () => {
      const res = await request(server)
        .get('/hello')
        .expect(200)

      expect(res.headers['x-content-type-options']).to.equal('nosniff')
    })

    it('should set X-Frame-Options: DENY by default', async () => {
      const res = await request(server)
        .get('/hello')
        .expect(200)

      expect(res.headers['x-frame-options']).to.equal('DENY')
    })

    it('should set X-XSS-Protection: 0 by default', async () => {
      const res = await request(server)
        .get('/hello')
        .expect(200)

      expect(res.headers['x-xss-protection']).to.equal('0')
    })

    it('should set Strict-Transport-Security header when HTTPS is detected (x-forwarded-proto)', async () => {
      const res = await request(server)
        .get('/hello')
        .set('x-forwarded-proto', 'https')
        .expect(200)

      expect(res.headers['strict-transport-security']).to.equal('max-age=15552000; includeSubDomains')
    })

    it('should successfully terminate the service', async () => {
      await service.close()
    })
  })

  // ──────────────────────────────────────────────────────
  // SEC-M-04b: Security Headers Disabled via Options
  // ──────────────────────────────────────────────────────
  describe('SEC-M-04b: security headers disabled via securityHeaders: false', () => {
    let server
    const service = require('../index')({ securityHeaders: false })

    service.get('/hello', (req, res) => {
      res.send('world')
    })

    it('should start service', async () => {
      server = await service.start(0)
    })

    it('should NOT set X-Content-Type-Options when disabled', async () => {
      const res = await request(server)
        .get('/hello')
        .expect(200)

      expect(res.headers['x-content-type-options']).to.equal(undefined)
    })

    it('should NOT set X-Frame-Options when disabled', async () => {
      const res = await request(server)
        .get('/hello')
        .expect(200)

      expect(res.headers['x-frame-options']).to.equal(undefined)
    })

    it('should NOT set X-XSS-Protection when disabled', async () => {
      const res = await request(server)
        .get('/hello')
        .expect(200)

      expect(res.headers['x-xss-protection']).to.equal(undefined)
    })

    it('should still serve responses normally', async () => {
      const res = await request(server)
        .get('/hello')
        .expect(200)

      expect(res.text).to.equal('world')
    })

    it('should successfully terminate the service', async () => {
      await service.close()
    })
  })

  // ──────────────────────────────────────────────────────
  // SEC-L-02: Deep Immutability of Config Options
  // ──────────────────────────────────────────────────────
  describe('SEC-L-02: config options deeply immutable', () => {
    it('should deep-freeze top-level config and non-server nested plain objects', () => {
      const service = require('../index')({
        server: http.createServer()
      })
      const opts = service.getConfigOptions()

      // Top-level properties are frozen (existing SEC-003 behavior)
      expect(Object.isFrozen(opts)).to.equal(true)

      // Attempting to replace the server reference is blocked
      expect(() => { opts.server = null }).to.throw()

      // Server is a live user-provided object — freezing it would break
      // listen/close operations. The framework returns the same reference
      // to preserve backward compatibility.
      expect(opts.server).to.equal(service.getServer())
    })

    it('should freeze nested plain objects in config options (all depths)', () => {
      const service = require('../index')({
        customNested: { key: 'value', nested: { inner: 'secret', deeper: { deepest: true } } }
      })
      const opts = service.getConfigOptions()

      // First level
      expect(Object.isFrozen(opts.customNested)).to.equal(true)
      // Second level
      expect(Object.isFrozen(opts.customNested.nested)).to.equal(true)
      // Third level
      expect(Object.isFrozen(opts.customNested.nested.deeper)).to.equal(true)
    })

    it('should NOT freeze user-provided original nested objects (no side effects)', () => {
      const myConfig = { key: 'value', nested: { inner: 'secret', deeper: { deepest: true } } }
      const service = require('../index')({
        customNested: myConfig
      })

      // Read config — this should NOT freeze the original at any depth
      service.getConfigOptions()

      expect(Object.isFrozen(myConfig)).to.equal(false)
      expect(Object.isFrozen(myConfig.nested)).to.equal(false)
      expect(Object.isFrozen(myConfig.nested.deeper)).to.equal(false)
      expect(() => { myConfig.key = 'updated' }).to.not.throw()
      expect(() => { myConfig.nested.inner = 'changed' }).to.not.throw()
      expect(() => { myConfig.nested.deeper.deepest = false }).to.not.throw()
    })

    it('should prevent mutation of top-level config properties', () => {
      const service = require('../index')()
      const opts = service.getConfigOptions()

      // Top-level property mutations must throw
      expect(() => { opts.prioRequestsProcessing = false }).to.throw()
      expect(() => { opts.routerCacheSize = 999 }).to.throw()
    })

    it('should return frozen copies that do not leak top-level mutations', () => {
      const service = require('../index')({
        customConfig: { someSetting: true }
      })

      // eslint-disable-next-line no-unused-vars
      const opts1 = service.getConfigOptions()

      // The internal options should be unaffected by any attempt to freeze-mutate
      const opts2 = service.getConfigOptions()

      // Top-level frozen structure is preserved
      expect(Object.isFrozen(opts2)).to.equal(true)
    })
  })
})
