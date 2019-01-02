/* global describe, it */
const expect = require('chai').expect
const request = require('supertest')

describe('Restana Web Framework - Smoke', () => {
  let server
  const service = require('./index')({ server: require('./libs/turbo-http') })

  it('should successfully register service routes', async () => {
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

    service.get('/middlewares/:name', async (req) => {
      return req.params.name
    }, {}, [(req, res, next) => {
      req.params.name = req.params.name.toUpperCase()
      next()
    }, (req, res, next) => {
      if (req.params.name === 'ERROR') {
        throw new Error('Upps')
      } else {
        next()
      }
    }, (req, res, next) => {
      req.params.name += '0'
      next()
    }])

    service.get('/error', () => {
      throw new Error('error')
    })

    service.get('/turbo-http-headers', (req, res) => {
      if (!req.headers || !req.headers['test'] || req.headers['test'] !== '123') {
        res.send(500)
      } else {
        res.send(200)
      }
    })

    service.get('/handler-override', (req, res) => res.send('1'))
    service.get('/handler-override', (req, res) => res.send('2'))

    server = await service.start(~~process.env.PORT)
  })

  it('should GET JSON response /pets/:id', async () => {
    await request(server)
      .get('/pets/0')
      .expect(200)
      .then((response) => {
        expect(response.body.name).to.equal('Happy Cat')
      })
  })

  it('should GET plain/text response /async/:name', async () => {
    await request(server)
      .get('/async/Cool')
      .expect(200)
      .then((response) => {
        expect(response.text).to.equal('Cool')
      })
  })

  it('should GET plain/text response /middlewares/:name - (route middlewares)', async () => {
    await request(server)
      .get('/middlewares/rolando')
      .expect(200)
      .then((response) => {
        expect(response.text).to.equal('ROLANDO0')
      })
  })

  it('should fail on GET /middlewares/:name - (route middlewares) middleware fail if name = error', async () => {
    await request(server)
      .get('/middlewares/error')
      .expect(500)
      .then((response) => {
        expect(response.body.message).to.equal('Upps')
      })
  })

  it('should fail on GET /error - 500 code expected', async () => {
    await request(server)
      .get('/error')
      .expect(500)
      .then((response) => {
        expect(response.body.message).to.equal('error')
      })
  })

  it('should fail on GET /sdsdfsf - default 404 response expected', async () => {
    await request(server)
      .get('/sdsdfsf')
      .expect(404)
  })

  it('should have req.headers as plain object when work with turbo-http', async () => {
    await request(server)
      .get('/turbo-http-headers')
      .set('test', '123')
      .expect(200)
  })

  it('should receive service routing keys array - i.e: ["[GET]/pets/:id"]', async () => {
    expect(service.routes().includes('[GET]/pets/:id')).to.equal(true)
  })

  it('should override route handler', async () => {
    await request(server)
      .get('/handler-override')
      .expect(200)
      .then((response) => {
        expect(response.text).to.equal('2')
      })
  })

  let errMsg
  it('should register 500 middleware - subsequent calls should fail with 500 error code', async () => {
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

  it('should fail on GET /pets/0 - after 500 middleware', async () => {
    await request(server)
      .get('/pets/0')
      .expect(500)
      .then((response) => {
        expect(errMsg).to.equal('Error: Simulated ERROR!')
      })
  })

  it('integrator callback should exist on service ', async () => {
    expect(service.callback instanceof Function).to.equal(true)
  })

  it('should successfully terminate the service', async () => {
    await service.close()
  })
})
