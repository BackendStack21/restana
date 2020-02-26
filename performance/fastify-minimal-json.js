'use strict'

const fastify = require('fastify')()

fastify.get('/hi', async (request, reply) => {
  return {
    msg: 'Hello World!'
  }
})

fastify.listen(3000)
