'use strict'

const service = require('../index')({})

service.get('/user/:id', (req, res) => {
  res.send(req.params.id)
})

service.start()
