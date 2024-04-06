'use strict'

/* global describe, it */
const request = require('supertest')

describe('Slow requests processing', () => {
  let server
  const service = require('../dist/index')({
    prioRequestsProcessing: false
  })
  service.get('/hello', (req, res) => {
    res.send(200)
  })

  it('should start the service with "prioRequestsProcessing: FALSE"', async () => {
    server = await service.start(~~process.env.PORT)
  })

  it('should GET 200 on /hello', async () => {
    await request(server)
      .get('/hello')
      .expect(200)
  })

  it('should successfully terminate the service', async () => {
    await service.close()
  })
})
