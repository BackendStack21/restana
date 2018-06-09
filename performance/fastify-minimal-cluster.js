const cluster = require('cluster')

if (cluster.isMaster) {
  const cpus = require('os').cpus().length

  for (var i = 0; i < cpus; i += 1) {
    cluster.fork()
  }
} else {
  const fastify = require('fastify')()

  fastify.get('/hi', async (request, reply) => {
    return 'Hello World!'
  })

  fastify.listen(3000)
}

cluster.on('exit', function (worker) {
  console.log('Worker %d died :(', worker.id)
  cluster.fork()
})
