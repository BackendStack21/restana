'use strict'

const service = require('./../index')({})
service.get('/hi', (req, res) => {
  res.send('Hello World!')
})

service.start()
