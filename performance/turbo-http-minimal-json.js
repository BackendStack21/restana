const turbo = require('turbo-http')
const server = turbo.createServer()
server.on('request', (req, res) => {
  setImmediate(() => (req.headers = req.getAllHeaders()))
})
const service = require('./../index')({
  server
})

service.get('/hi', (req, res) => {
  res.send({
    msg: 'Hello World!'
  })
})

service.start()
