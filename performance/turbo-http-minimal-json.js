const turbo = require('turbo-http')
const service = require('./../index')({
  server: turbo.createServer()
})

// the /v1/welcome route handler
service.get('/hi', (req, res) => {
  res.send({
    msg: 'Hello World!'
  })
})

service.start()
