const service = require('./../index')({})

service.get('/hi', (req, res) => {
  res.send({
    msg: 'Hello World!'
  })
})
service.start()
