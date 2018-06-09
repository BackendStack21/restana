const fastify = require('fastify')()

fastify.get('/hi', async (request, reply) => {
  return 'Hello World!'
})

fastify.listen(3000)
