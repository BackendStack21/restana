'use strict'

/* global describe, it */
const expect = require('chai').expect
const request = require('supertest')
const restana = require('../index')

describe('Restana 7.0 behavior', () => {
  it('formats default error handler responses like res.send(err)', async () => {
    const service = restana()
    service.get('/forbidden', async () => {
      throw Object.assign(new Error('secret'), { status: 403, data: { token: 'x' } })
    })
    service.get('/string', (req, res, next) => next('database password'))
    service.get('/object', (req, res, next) => next({ status: 409 }))

    const server = await service.start(0, '127.0.0.1')
    await request(server).get('/forbidden').expect(403, { code: 403, message: 'Forbidden' })
    await request(server).get('/string').expect(500, { code: 500, message: 'Internal Server Error' })
    await request(server).get('/object').expect(409, { code: 409, message: 'Conflict' })
    await service.close()
  })

  it('exposes default error handler details only with debugErrors', async () => {
    const service = restana({ debugErrors: true })
    service.get('/', (req, res, next) => next(Object.assign(new Error('detail'), { status: 400, data: 1 })))
    service.get('/string', (req, res, next) => next('raw'))

    const server = await service.start(0, '127.0.0.1')
    await request(server).get('/').expect(400, { code: 400, message: 'detail', data: 1 })
    await request(server).get('/string').expect(500, { code: 500, message: 'Non-error value thrown', data: 'raw' })
    await service.close()
  })

  it('serializes numbers that are not status codes as JSON', async () => {
    const service = restana()
    service.get('/float', (req, res) => res.send(42.5))
    service.get('/zero', (req, res) => res.send(0, 201))
    service.get('/status', (req, res) => res.send(204))

    const server = await service.start(0, '127.0.0.1')
    const float = await request(server).get('/float').expect(200)
    expect(float.headers['content-type']).to.equal('application/json; charset=utf-8')
    expect(float.text).to.equal('42.5')
    await request(server).get('/zero').expect(201).then(res => expect(res.text).to.equal('0'))
    await request(server).get('/status').expect(204)
    await service.close()
  })

  it('loads the sequential router only when selected', () => {
    const { execFileSync } = require('child_process')
    const loaded = (code) => JSON.parse(execFileSync(process.execPath, ['-e', `
      const restana = require(${JSON.stringify(require.resolve('../index'))})
      ${code}
      console.log(JSON.stringify(Object.keys(require.cache).some(file => file.includes('sequential'))))
    `]).toString())

    expect(loaded('restana()')).to.equal(false)
    expect(loaded("restana({ router: 'sequential' })")).to.equal(true)
  })

  it('exposes only the public entry points', () => {
    const exports = require('../package.json').exports
    expect(Object.keys(exports)).to.deep.equal(['.', './libs/elastic-apm', './libs/newrelic-apm', './package.json'])
    for (const entry of Object.values(exports)) {
      const target = typeof entry === 'string' ? entry : entry.default
      expect(() => require.resolve(`../${target}`)).to.not.throw()
    }
  })
})
