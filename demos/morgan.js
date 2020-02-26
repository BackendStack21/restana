'use strict'

const service = require('./../index')({})
const morgan = require('morgan')

service.use(morgan('tiny'))
service.get('/v1/welcome', (req, res) => {
  res.send('Hello World!')
})

// start the server
service.start()
