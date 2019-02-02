const server = require('../libs/uwebsockets')()
const service = require('../index')({
  server
})

service.get('/user/:id', (req, res) => {
  res.send(req.params.id)
})

service.start()
