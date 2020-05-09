'use strict'

const service = require('../index')({
  errorHandler (err, req, res) {
    console.log(`Unexpected error: ${err.message}`)
    res.send(err)
  }
})

service.get('/throw', (req, res) => {
  throw new Error('Upps!')
})

const router = service.newRouter()
router.get('/throw', async (req, res) => {
  throw new Error('Upps from nested router!')
})

service.use('/nested', router)

service.start()
