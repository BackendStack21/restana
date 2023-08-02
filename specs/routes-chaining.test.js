'use strict'

/* global describe, it */
const request = require('supertest')

describe('Routes registration - method chaining', () => {
  let server
  const service = require('../dist/index')()
  const op200 = (req, res) => {
    res.send()
  }
  service
    .get('/', op200)
    .post('/', op200)
    .get('/chain', op200)

  it('should start service', async () => {
    server = await service.start(~~process.env.PORT)
  })

  it('should GET 200 for all registered routes', async () => {
    await request(server)
      .get('/')
      .expect(200)
    await request(server)
      .post('/')
      .expect(200)
    await request(server)
      .get('/chain')
      .expect(200)
  })

  it('should successfully terminate the service', async () => {
    await service.close()
  })
})
