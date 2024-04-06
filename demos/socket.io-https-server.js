'use strict'

const http = require('https')
const pem = require('pem')

pem.createCertificate({
  days: 1,
  selfSigned: true
}, (err, keys) => {
  if (err) console.error(err)

  const app = require('../dist/index')({
    server: http.createServer({
      key: keys.serviceKey,
      cert: keys.certificate
    })
  })

  const io = require('socket.io')()
  io.on('connection', socket => {
    console.log(socket.id)
  })

  io.listen(app.getServer())
  io.set('origins', '*:*')

  app.start(3000)
})
