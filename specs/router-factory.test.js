/* global describe, it */
const request = require('supertest')
const expect = require('chai').expect

describe('Router Factory - overriding find-my-way router with "anumargak"', () => {
  let server
  const anumargak = require('anumargak')

  const service = require('../index')({
    routerFactory: (options) => {
      console.log('creating anumargak router...')
      return anumargak(options)
    }
  })
  service.get('/hello/:name', (req, res) => {
    res.send(req._path.params.name)
  })

  it('should start the service with "anumargak" router', async () => {
    server = await service.start(~~process.env.PORT)
  })

  it('should GET 200 on /hello', async () => {
    await request(server)
      .get('/hello/restana')
      .expect(200)
      .then((response) => {
        expect(response.text).to.equal('restana')
      })
  })

  it('should successfully terminate the service', async () => {
    await service.close()
  })
})
