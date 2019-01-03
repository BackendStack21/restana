/* global describe, it */
const request = require('supertest')

describe('Router Factory - overriding find-my-way router with "anumargak"', () => {
  let server
  const anumargak = require('anumargak')

  const service = require('../index')({
    routerFactory: (options) => {
      console.log('creating anumargak router...')
      return anumargak(options)
    }
  })
  service.get('/hello', (req, res) => {
    res.send(200)
  })

  it('should start the service with "anumargak" router', async () => {
    server = await service.start(~~process.env.PORT)
  })

  it('should GET 200 on /hello', async () => {
    await request(server)
      .get('/hello')
      .expect(200)
  })

  it('should successfully terminate the service', async () => {
    await service.close()
  })
})
