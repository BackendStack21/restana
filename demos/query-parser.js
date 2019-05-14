const queryParser = require('connect-query')
const service = require('./../index')({})
service.use(queryParser())

service.get('/params', (req, res) => {
  res.send(req.query)
})

service.start()
