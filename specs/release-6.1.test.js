'use strict'

/* global describe, it */
const expect = require('chai').expect
const http = require('http')
const request = require('supertest')
const stream = require('stream')
const restana = require('../index')

describe('Restana 6.1 improvements', () => {
  it('rejects start when the address is already in use', async () => {
    const occupied = http.createServer()
    await new Promise(resolve => occupied.listen(0, '127.0.0.1', resolve))

    const service = restana()
    let startError
    try {
      await service.start(occupied.address().port, '127.0.0.1')
    } catch (err) {
      startError = err
    }

    expect(startError).to.have.property('code', 'EADDRINUSE')
    await new Promise(resolve => occupied.close(resolve))
  })

  it('supports boolean payloads and array-valued response headers', async () => {
    const service = restana()
    service.get('/false', (req, res) => {
      res.send(false, 200, { vary: ['accept', 'origin'] })
    })
    const server = await service.start(0, '127.0.0.1')

    await request(server)
      .get('/false')
      .expect(200)
      .expect('content-type', 'application/json; charset=utf-8')
      .expect('vary', 'accept, origin')
      .expect('false')

    await service.close()
  })

  it('blocks all connection-specific and cookie response headers', async () => {
    const service = restana()
    service.get('/', (req, res) => {
      res.send('ok', 200, {
        connection: 'close',
        'set-cookie2': 'session=unsafe',
        upgrade: 'websocket'
      })
    })
    const server = await service.start(0, '127.0.0.1')
    const response = await request(server).get('/').expect(200)

    expect(response.headers['set-cookie2']).to.equal(undefined)
    expect(response.headers.upgrade).to.equal(undefined)
    await service.close()
  })

  it('rejects injection in array-valued response headers', async () => {
    const service = restana()
    service.get('/', (req, res) => {
      res.send('ok', 200, { vary: ['accept', 'origin\r\nx-injected: true'] })
    })
    const server = await service.start(0, '127.0.0.1')
    const response = await request(server).get('/').expect(200, 'ok')

    expect(response.headers.vary).to.equal(undefined)
    expect(response.headers['x-injected']).to.equal(undefined)
    await service.close()
  })

  it('masks an early stream failure through the default error handler', async () => {
    const service = restana()
    service.get('/', (req, res) => {
      res.send(new stream.Readable({
        read () {
          this.destroy(new Error('sensitive stream failure'))
        }
      }))
    })
    const server = await service.start(0, '127.0.0.1')
    const response = await request(server).get('/').expect(500)

    expect(response.body.message).to.equal('Internal Server Error')
    expect(JSON.stringify(response.body)).to.not.include('sensitive stream failure')
    await service.close()
  })

  it('only trusts x-forwarded-proto when trustProxy is enabled', async () => {
    const direct = restana()
    direct.get('/', (req, res) => res.send('ok'))
    const directServer = await direct.start(0, '127.0.0.1')
    const directResponse = await request(directServer)
      .get('/')
      .set('x-forwarded-proto', 'https')
      .expect(200)
    expect(directResponse.headers['strict-transport-security']).to.equal(undefined)
    await direct.close()

    const proxied = restana({ trustProxy: true })
    proxied.get('/', (req, res) => res.send('ok'))
    const proxiedServer = await proxied.start(0, '127.0.0.1')
    const proxiedResponse = await request(proxiedServer)
      .get('/')
      .set('x-forwarded-proto', 'https, http')
      .expect(200)
    expect(proxiedResponse.headers['strict-transport-security'])
      .to.equal('max-age=15552000; includeSubDomains')

    const normalizedResponse = await request(proxiedServer)
      .get('/')
      .set('x-forwarded-proto', 'HTTPS, http')
      .expect(200)
    expect(normalizedResponse.headers['strict-transport-security'])
      .to.equal('max-age=15552000; includeSubDomains')
    await proxied.close()
  })

  it('returns an isolated, deeply frozen configuration snapshot', () => {
    const array = [{ enabled: true }]
    const circular = { name: 'root' }
    circular.self = circular

    const options = { array, circular }
    const snapshot = restana(options).getConfigOptions()

    expect(Object.isFrozen(snapshot.array)).to.equal(true)
    expect(Object.isFrozen(snapshot.array[0])).to.equal(true)
    expect(snapshot.circular.self).to.equal(snapshot.circular)
    expect(() => snapshot.array.push('unsafe')).to.throw()
    expect(array).to.deep.equal([{ enabled: true }])
  })

  it('honors routerCacheSize zero for dynamic registration', async () => {
    const service = restana({ routerCacheSize: 0 })
    const server = await service.start(0, '127.0.0.1')

    await request(server).get('/late').expect(404)
    service.get('/late', (req, res) => res.send('registered'))
    await request(server).get('/late').expect(200, 'registered')

    await service.close()
  })

  it('isolates cached route parameters between requests', async () => {
    const service = restana()
    service.get('/params/:id', (req, res) => {
      const leaked = req.params.requestMarker
      req.params.requestMarker = 'first-request'
      res.send({ leaked: leaked || null })
    })
    const server = await service.start(0, '127.0.0.1')

    await request(server).get('/params/1').expect(200, { leaked: null })
    await request(server).get('/params/1').expect(200, { leaked: null })

    await service.close()
  })

  it('only exposes error details through explicit debugErrors opt-in', async () => {
    const service = restana({
      debugErrors: true,
      errorHandler (err, req, res) {
        res.send(err)
      }
    })
    service.get('/', () => {
      throw new Error('debug detail')
    })
    const server = await service.start(0, '127.0.0.1')

    await request(server)
      .get('/')
      .expect(500)
      .expect(({ body }) => expect(body.message).to.equal('debug detail'))

    await service.close()
  })
})
