'use strict'

/* global describe, it */
const expect = require('chai').expect
const request = require('supertest')

describe('Buffer Responses', () => {
  let server
  const service = require('../index')()
  const nestedRouter = service.newRouter()

  nestedRouter.get('/hello', (req, res) => {
    res.send('Hello World!', 200, {
      'x-header': '1'
    })
  })

  service.use('/v1', nestedRouter)

  it('should start service', async () => {
    server = await service.start(~~process.env.PORT)
  })

  it('should hit GET /v1/hello on nested router', async () => {
    await request(server)
      .get('/v1/hello')
      .expect(200)
      .then((response) => {
        expect(response.text).to.equal('Hello World!')
        expect(response.headers['x-header']).to.equal('1')
      })
  })

  it('should successfully terminate the service', async () => {
    await service.close()
  })
})
