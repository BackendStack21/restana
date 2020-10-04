'use strict'

const http = require('http')
const service = require('./../index')()

service.get('/hi', (req, res) => {
  res.send({
    msg: 'Hello World!'
  })
})

http.createServer(service).listen(3000, '0.0.0.0', function () {
  console.log('running')
})
