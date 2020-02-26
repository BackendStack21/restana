'use strict'

const service = require('../index')({
  prioRequestsProcessing: false
})

service.get('/hi', (req, res) => {
  res.send('Hello World!')
})
service.start()
