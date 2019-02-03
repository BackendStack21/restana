/* global describe, it */
const request = require('supertest')
const expect = require('chai').expect

describe('Express.js like routes handlers', () => {
  let server
  const service = require('../index')()

  const m1 = (req, res, next) => {
    next()
  }
  const m2 = (req, res, next) => {
    next()
  }

  const m3 = (req, res, next) => {
    res.body = { name: req.params.name }
    next()
  }

  service.get('/hello/:name', m1, m2, m3, (req, res) => {
    res.send(200)
  })

  it('should start the service', async () => {
    server = await service.start(~~process.env.PORT)
  })

  it('should GET 200 on /hello/:name', async () => {
    await request(server)
      .get('/hello/express')
      .expect(200)
      .then((response) => {
        expect(response.body.name).to.equal('express')
      })
  })

  it('should successfully terminate the service', async () => {
    await service.close()
  })
})
