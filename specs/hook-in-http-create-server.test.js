'use strict'

/* global describe, it */
const request = require('supertest')
const http = require('http')

describe('http.createServer()', () => {
  let server
  const service = require('../dist/index')()

  service.get('/string', (req, res) => {
    res.send('Hello World!')
  })

  it('should start service', async () => {
    server = http.createServer(service)
    server.listen(~~process.env.PORT, '0.0.0.0', () => {})
  })

  it('should GET 200 and string content on /string', async () => {
    await request(server)
      .get('/string')
      .expect(200)
      .expect('content-type', 'text/plain; charset=utf-8')
      .expect('Hello World!')
  })

  it('should successfully terminate the service', async () => {
    await server.close()
  })
})
