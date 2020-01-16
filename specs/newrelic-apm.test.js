/* global describe, it, beforeEach */
const expect = require('chai').expect
const request = require('supertest')
const newrelicApm = require('../libs/newrelic-apm')

describe('Elastic APM Instrumentation', () => {
  let server
  let pattern = null

  const { patch } = newrelicApm({
    agent: {
      setTransactionName (name) {
        pattern = name
      }
    }
  })

  beforeEach(() => {
    pattern = null
  })

  const service = require('../index')()
  patch(service)

  service.get('/hello', (req, res) => {
    res.send('Hello World!')
  })

  service.get('/user/:id', (req, res) => {
    res.send({
      id: req.params.id
    })
  })

  it('should start service', async () => {
    server = await service.start(~~process.env.PORT)
  })

  it('should set transaction name = route pattern (/hello)', async () => {
    await request(server)
      .get('/hello')
      .expect(200)
      .then((response) => {
        expect(response.text).to.equal('Hello World!')
      })

    expect(pattern).to.equal('GET /hello')
  })

  it('should not set pattern on 404', async () => {
    await request(server)
      .get('/404')
      .expect(404)

    expect(pattern).to.equal(null)
  })

  it('should set transaction name = route pattern (/user/:id)', async () => {
    await request(server)
      .get('/user/restana')
      .expect(200)
      .then((response) => {
        expect(response.body.id).to.equal('restana')
      })

    expect(pattern).to.equal('GET /user/:id')
  })

  it('should successfully terminate the service', async () => {
    await service.close()
  })
})
