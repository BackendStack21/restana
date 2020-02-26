'use strict'

const restify = require('restify')

const server = restify.createServer()
server.get('/hi', (req, res, next) => {
  res.send('Hello World!')
  next()
})

server.listen(3000)
