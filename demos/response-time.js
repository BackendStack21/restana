'use strict'

const service = require('./../index')({})

// custom middleware to attach the X-Response-Time header to the response
service.use(require('response-time')())

// the /v1/welcome route handler
service.get('/v1/welcome', (req, res) => {
  res.send('Hello World!')
})

// start the server
service.start()
