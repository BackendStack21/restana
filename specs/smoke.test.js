'use strict'

/* global describe, it */
const expect = require('chai').expect
const request = require('supertest')
const http = require('http')

describe('Restana Web Framework - Smoke', () => {
  let server
  const service = require('../dist/index')({
    server: http.createServer()
  })

  it('service options are exposed through getServiceOptions', (done) => {
    expect(typeof service.getConfigOptions().server).to.equal('object')
    expect(service.getConfigOptions().server).to.equal(service.getServer())
    done()
  })

  it('should successfully register service routes', async () => {
    service.get(
      '/pets/:id',
      function (req, res) {
        res.body = {
          name: 'Happy Cat'
        }
        res.send(200)
      }
    )

    service.get('/async/:name', async (req, res) => {
      res.send(req.params.name)
    })

    service.get('/middlewares/:name', (req, res, next) => {
      req.params.name = req.params.name.toUpperCase()

      return next()
    }, async (req, res, next) => {
      if (req.params.name === 'ERROR') {
        throw new Error('Upps')
      } else {
        return next()
      }
    }, (req, res, next) => {
      req.params.name += '0'

      return next()
    }, (req, res) => {
      res.send(req.params.name)
    })

    service.get('/error', () => {
      throw new Error('error')
    })

    service.all('/sheet.css', (req, res) => res.send(200))

    server = await service.start(~~process.env.PORT)
  })

  it('routes should exist on service', async () => {
    expect(service.routes().includes('GET/async/:name')).to.equal(true)
    expect(service.routes().includes('ALL/sheet.css')).to.equal(true)
  })

  it('should GET JSON response /pets/:id', async () => {
    await request(server)
      .get('/pets/0')
      .expect(200)
      .then((response) => {
        expect(response.body.name).to.equal('Happy Cat')
      })
  })

  it('should get service router', async () => {
    expect(typeof service.getRouter()).to.equal('object')
  })

  it('should get new router', async () => {
    expect(typeof service.newRouter()).to.equal('object')
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

  it('should receive 200 on /sheet.css using .all registration', async () => {
    await request(server)
      .get('/sheet.css')
      .expect(200)
    await request(server)
      .post('/sheet.css')
      .expect(200)
    await request(server)
      .put('/sheet.css')
      .expect(200)
  })

  it('integrator callback should exist on service ', async () => {
    expect(service.callback instanceof Function).to.equal(true)
  })

  it('should successfully terminate the service', async () => {
    await service.close()
  })
})
