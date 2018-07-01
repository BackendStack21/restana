const turbo = require('turbo-http')
const server = turbo.createServer()
server.on('request', (req, res) => {
  setImmediate(() => (req.headers = req.getAllHeaders()))
})
const service = require('./../index')({
  server
})

// the /v1/welcome route handler
service.get('/hi', (req, res) => {
  res.send('Hello World!')
})

service.start()
