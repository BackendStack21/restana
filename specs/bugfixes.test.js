'use strict'

/* global describe, it */
const expect = require('chai').expect
const request = require('supertest')
const restana = require('../index')
const apm = require('../libs/apm-base')

const systemError = () => {
  const err = new Error('missing file')
  err.code = 'ENOENT'
  err.statusCode = 404
  return err
}

describe('Bug fixes', () => {
  it('keeps the explicit status code when sending an undefined body', async () => {
    const service = restana()
    service.get('/undefined', (req, res) => res.send(undefined, 201))
    service.get('/promise', (req, res) => res.send(Promise.resolve(), 204))
    service.get('/body', (req, res) => {
      res.body = { ok: true }
      res.send(undefined, 202)
    })
    service.get('/default', (req, res) => {
      res.statusCode = 202
      res.send()
    })

    const server = await service.start(0, '127.0.0.1')
    await request(server).get('/undefined').expect(201)
    await request(server).get('/promise').expect(204)
    await request(server).get('/body').expect(202, { ok: true })
    await request(server).get('/default').expect(202)
    await service.close()
  })

  it('ignores non-numeric error codes when resolving the status code', async () => {
    const service = restana()
    service.get('/send', (req, res) => res.send(systemError()))
    service.get('/next', (req, res, next) => next(systemError()))
    service.get('/string-status', (req, res) => {
      const err = new Error('bad')
      err.status = '400'
      res.send(err)
    })

    const server = await service.start(0, '127.0.0.1')
    await request(server).get('/send').expect(404, { code: 404, message: 'Not Found' })
    await request(server).get('/next').expect(404, { code: 404, message: 'Not Found' })
    await request(server).get('/string-status').expect(500)
    await service.close()
  })

  it('exposes the Protocol and Method enums at runtime', () => {
    expect(restana.Protocol.HTTP2).to.equal('http2')
    expect(restana.Method.GET).to.equal('get')
    expect(Object.isFrozen(restana.Protocol)).to.equal(true)
  })

  it('names APM transactions per path for multi-path routes', async () => {
    const names = []
    const service = restana()
    apm({ agent: { setTransactionName: name => names.push(name) } }).patch(service)
    expect(service.get(['/a', '/b'], (req, res) => res.send('ok'))).to.equal(service)

    const server = await service.start(0, '127.0.0.1')
    await request(server).get('/a').expect(200)
    await request(server).get('/b').expect(200)
    await service.close()

    expect(names).to.deep.equal(['GET /a', 'GET /b'])
    expect(service.routes()).to.deep.equal(['GET/a', 'GET/b'])
  })
})
