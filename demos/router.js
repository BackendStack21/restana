const restana = require('./../index')
const morgan = require('morgan')

const service = restana()
service.use(morgan('tiny'))

const router = restana() // path prefix ???
router.get('')
service.get('/v1/welcome', (req, res) => {
  res.send('Hello World!')
})

// start the server
service.start()
