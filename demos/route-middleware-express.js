'use strict'

const service = require('../dist/index')({})

// route without middlewares
service.get('/hi/:name', async (req, res) => {
  return 'Hello ' + req.params.name
})

// route with middlewares using express like signature
service.get('/hi-m/:name', (req, res, next) => {
  req.params.name = req.params.name.toUpperCase()
  next()
}, async (req, res) => {
  return 'Hello ' + req.params.name
})

// start the server
service.start()
