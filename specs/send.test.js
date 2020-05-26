'use strict'

/* global describe, it */
const request = require('supertest')
const { createReadStream, readFileSync } = require('fs')
const path = require('path')

describe('All Responses', () => {
  let server
  const service = require('../index')()

  service.get('/string', (req, res) => {
    res.send('Hello World!')
  })

  service.get('/buffer', (req, res) => {
    res.send(Buffer.from('Hello World!'))
  })

  service.get('/buffer-string', (req, res) => {
    res.setHeader('content-type', 'text/plan; charset=utf-8')
    res.send(Buffer.from('Hello World!'))
  })

  service.get('/json', (req, res) => {
    res.send({ id: 'restana' })
  })

  service.get('/stream', (req, res) => {
    res.setHeader('content-type', 'text/html; charset=utf-8')
    res.send(createReadStream(path.resolve(__dirname, '../demos/static/src/index.html'), { encoding: 'utf8' }))
  })

  service.get('/error', (req, res) => {
    const err = new Error('Test')
    err.code = 501
    res.send(err)
  })

  it('should start service', async () => {
    server = await service.start(~~process.env.PORT)
  })

  it('should GET 200 and string content on /string', async () => {
    await request(server)
      .get('/string')
      .expect(200)
      .expect('Hello World!')
  })

  it('should GET 200 and buffer content on /buffer', async () => {
    await request(server)
      .get('/buffer')
      .expect(200)
      .expect('content-type', 'application/octet-stream')
      .expect(Buffer.from('Hello World!'))
  })

  it('should GET 200 and string content on /buffer-string', async () => {
    await request(server)
      .get('/buffer-string')
      .expect(200)
      .expect('Hello World!')
  })

  it('should GET 200 and json content on /json', async () => {
    await request(server)
      .get('/json')
      .expect(200)
      .expect('content-type', 'application/json; charset=utf-8')
      .expect({ id: 'restana' })
  })

  it('should GET 200 and buffer content on /stream', async () => {
    await request(server)
      .get('/stream')
      .expect(200)
      .expect('content-type', 'text/html; charset=utf-8')
      .expect(readFileSync(path.resolve(__dirname, '../demos/static/src/index.html'), 'utf8'))
  })

  it('should GET 501 and json content on /error', async () => {
    await request(server)
      .get('/error')
      .expect(501)
      .expect('content-type', 'application/json; charset=utf-8')
      .expect({
        code: 501,
        message: 'Test'
      })
  })

  it('should successfully terminate the service', async () => {
    await service.close()
  })
})
