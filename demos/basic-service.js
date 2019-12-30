const service = require('./../index')({})

// the /v1/welcome route handler
service.get('/v1/welcome', (req, res) => {
  res.send('Hello World!')
})

// start the server
service.start()
