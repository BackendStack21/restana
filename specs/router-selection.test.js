'use strict'

/* global describe, it */
const expect = require('chai').expect
const request = require('supertest')
const restana = require('../index')

const build = async (options) => {
  const service = restana(options)
  service.get('/admin', (req, res) => res.send('admin'))
  service.get('/users/:id', (req, res) => res.send(req.params.id))
  const nested = service.newRouter()
  nested.get('/items/:id', (req, res) => res.send(`item ${req.params.id}`))
  service.use('/api', nested)
  const server = await service.start(0, '127.0.0.1')
  return { service, server }
}

describe('Router selection', () => {
  it('uses the case-sensitive trie router by default', async () => {
    const { service, server } = await build()
    await request(server).get('/admin').expect(200, 'admin')
    await request(server).get('/admin/').expect(200, 'admin')
    await request(server).get('/ADMIN').expect(404)
    await request(server).get('/users/42').expect(200, '42')
    await request(server).get('/api/items/7').expect(200, 'item 7')
    expect(service.getRouter().find).to.be.a('function')
    await service.close()
  })

  it('supports case-insensitive and strict trailing slash matching', async () => {
    const { service, server } = await build({ caseSensitive: false, ignoreTrailingSlash: false })
    await request(server).get('/ADMIN').expect(200, 'admin')
    await request(server).get('/admin/').expect(404)
    await service.close()
  })

  it('keeps the sequential router available', async () => {
    const { service, server } = await build({ router: 'sequential' })
    await request(server).get('/ADMIN').expect(200, 'admin')
    await request(server).get('/api/items/7').expect(200, 'item 7')
    await service.close()
  })

  it('rejects unknown router types', () => {
    expect(() => restana({ router: 'radix' })).to.throw(TypeError, /Unsupported router type/)
  })
})
