'use strict'

const service = require('./../dist/index')({})
service.get('/params', (req, res) => {
  res.send(req.query)
})

service.start()
