'use strict'

const http = require('http')

const service = new http.Server()
service.on('request', (req, res) => {
  if (req.method === 'GET' && req.url === '/hi') {
    res.end('Hello World!')
  } else {
    res.statusCode = 404
    res.end()
  }
})

service.listen(3000)
