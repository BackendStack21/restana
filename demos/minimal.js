'use strict'

const service = require('./../dist/index')({})

service.get('/hi', (req, res) => {
  res.send('Hello World!')
})
service.start()
