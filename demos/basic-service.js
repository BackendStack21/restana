'use strict'

const service = require('./../dist/index')({})

// the /v1/welcome route handler
service.get('/v1/welcome', (req, res) => {
  res.send('Hello World!')
})

// start the server
service.start()
