'use strict'

/* global describe, it */
const expect = require('chai').expect
const request = require('supertest')

describe('Buffer Responses', () => {
  let server
  const service = require('../index')()
  service.get('/hello', (req, res) => {
    res.send(Buffer.from('Hello World!'))
  })

  it('should start service', async () => {
    server = await service.start(~~process.env.PORT)
  })

  it('should GET 200 and buffer content on /hello', async () => {
    await request(server)
      .get('/hello')
      .expect(200)
      .then((response) => {
        expect(response.text).to.equal('Hello World!')
      })
  })

  it('should successfully terminate the service', async () => {
    await service.close()
  })
})
