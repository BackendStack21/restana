const service = require('./../index')({
  disableResponseEvent: true
})

service.get('/hi', (req, res) => {
  res.send('Hello World!')
})
service.start()
