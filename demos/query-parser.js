'use strict'

const service = require('./../index')({})
service.get('/params', (req, res) => {
  res.send(req.query)
})

service.start()
