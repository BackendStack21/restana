'use strict'

const service = require('../index')({})

// the /v1/welcome route handler
service.get('/routes', (req, res) => {
  res.send(service.routes())
})

// start the server
service.start()
