const anumargak = require('anumargak')

const service = require('./../index')({
  routerFactory: (options) => {
    console.log('creating anumargak router...')
    return anumargak(options)
  }
})

service.get('/hi', (req, res) => {
  res.send('Hello World!')
})
service.start()
