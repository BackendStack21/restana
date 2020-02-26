'use strict'

const service = require('polka')({})

service.get('/hi', (req, res) => {
  res.end('Hello World!')
})
service.listen(3000)
