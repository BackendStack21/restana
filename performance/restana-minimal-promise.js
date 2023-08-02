'use strict'

const service = require('../dist/index')({})
service.get('/hi', (req, res) => {
  res.send(Promise.resolve('Hello World!'))
})

service.start()
