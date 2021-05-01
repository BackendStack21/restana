'use strict'

const anumargak = require('anumargak')
const cluster = require('cluster')

if (cluster.isMaster) {
  const cpus = require('os').cpus().length

  for (let i = 0; i < cpus; i += 1) {
    cluster.fork()
  }
} else {
  const service = require('../index')({
    routerFactory: (options) => {
      return anumargak(options)
    }
  })

  service.get('/hi', (req, res) => {
    res.send('Hello World!')
  })
  service.start()
}

cluster.on('exit', function (worker) {
  console.log('Worker %d died :(', worker.id)
  cluster.fork()
})
