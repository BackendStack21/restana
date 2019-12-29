const http = require('https')
const pem = require('pem')

pem.createCertificate({
  days: 1,
  selfSigned: true
}, (err, keys) => {
  if (err) console.error(err)

  const app = require('../index')({
    server: http.createServer({
      key: keys.serviceKey,
      cert: keys.certificate
    })
  })

  app.start(3000).then(() => {
    console.log('server running on port 3000')
  })

  const io = require('socket.io')()
  io.on('connection', socket => {
    console.log(socket.id)
  })

  io.listen(app.getServer())
  io.set('origins', '*:*')
})
