const server = require('./../libs/turbo-http')
const service = require('./../index')({
  server
})

service.get('/hi', (req, res) => {
  res.send({
    msg: 'Hello World!'
  })
})

service.start()
