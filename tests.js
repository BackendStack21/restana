/* global describe, it */
const service = require('./index')({ server: require('./libs/turbo-http') })
const expect = require('chai').expect
const request = require('supertest')

let server

describe('Ana Web Framework', () => {
  it('initialize', async () => {
    service.get(
      '/pets/:id',
      function (req, res) {
        res.body = this[req.params.id]
        res.send(200)
      },
      [
        {
          name: 'Happy Cat'
        }
      ]
    )

    service.get('/async/:name', async (req) => {
      return req.params.name
    })

    service.get('/error', () => {
      throw new Error('error')
    })

    server = await service.start()
  })

  it('request pet', async () => {
    await request(server)
      .get('/pets/0')
      .expect(200)
      .then((response) => {
        expect(response.body.name).to.equal('Happy Cat')
      })
  })

  it('request async', async () => {
    await request(server)
      .get('/async/Cool')
      .expect(200)
      .then((response) => {
        expect(response.text).to.equal('Cool')
      })
  })

  it('request error', async () => {
    await request(server)
      .get('/error')
      .expect(500)
      .then((response) => {
        expect(response.body.message).to.equal('error')
      })
  })

  it('request 404', async () => {
    await request(server)
      .get('/sdsdfsf')
      .expect(404)
  })

  it('routes', async () => {
    expect(service.routes().includes('[GET]/pets/:id')).to.equal(true)
  })

  let errMsg
  it('adding 500 middleware', async () => {
    service.use((req, res, next) => {
      res.on('response', e => {
        if (e.code >= 400) {
          if (e.data && e.data.errClass) {
            errMsg = e.data.errClass + ': ' + e.data.message
          }
        }
      })

      return next(new Error('Simulated ERROR!'))
    })
  })

  it('call /pets/0 should fail after 500 middleware', async () => {
    await request(server)
      .get('/pets/0')
      .expect(500)
      .then((response) => {
        expect(errMsg).to.equal('Error: Simulated ERROR!')
      })
  })

  it('close', async () => {
    await service.close()
  })
})
