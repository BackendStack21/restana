'use strict'

const service = require('../index')({})
service.get('/hi', (req, res) => {
  res.send(Promise.resolve('Hello World!'))
})

service.start()
