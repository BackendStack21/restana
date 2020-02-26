'use strict'

/* global describe, it */
const request = require('supertest')
const expect = require('chai').expect

describe('Disable Response Event', () => {
  let server
  const service = require('../index')({
    disableResponseEvent: true
  })
  service.use((req, res, next) => {
    const now = new Date().getTime()

    res.on('response', (e) => {
      e.res.setHeader('x-response-time', new Date().getTime() - now)
    })

    return next()
  })
  service.get('/hello', (req, res) => {
    res.send(200)
  })

  it('should start the service with "disableResponseEvent: TRUE"', async () => {
    server = await service.start(~~process.env.PORT)
  })

  it('should GET 200 on /hello and no response header', async () => {
    await request(server)
      .get('/hello')
      .expect(200)
      .then((response) => {
        expect(response.headers['x-response-time']).to.equal(undefined)
      })
  })

  it('should successfully terminate the service', async () => {
    await service.close()
  })
})
