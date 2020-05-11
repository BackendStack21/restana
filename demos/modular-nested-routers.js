'use strict'

// example on how to setup modular routers
// https://github.com/jkyberneees/0http#0http---sequential-default-router
const sequential = require('0http/lib/router/sequential')
const router1 = sequential()
router1.get('/hi/:name', (req, res) => {
  res.send('Hello ' + req.params.name)
})

// restana service
const service = require('./../index')({})
service.use('/actions', router1)

service.start()
