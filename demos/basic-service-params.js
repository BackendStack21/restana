'use strict'

const service = require('../dist/index')({})

service.get('/user/:id', (req, res) => {
  res.send('Hello user: ' + req.params.id)
})

service.start()
