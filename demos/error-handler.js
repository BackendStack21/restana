const service = require('../index')({
  errorHandler (err, req, res) {
    console.log(`Unexpected error: ${err.message}`)
    res.send(err)
  }
})

service.get('/throw', (req, res) => {
  throw new Error('Upps!')
})

service.start()
