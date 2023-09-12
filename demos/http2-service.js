'use strict'

const http2 = require('http2')
const pem = require('pem')

pem.createCertificate({
  days: 1,
  selfSigned: true
}, (err, keys) => {
  if (err) console.error(err)

  const service = require('./../dist/index')({
    server: http2.createSecureServer({
      key: keys.serviceKey,
      cert: keys.certificate
    })
  })

  service.get('/v1/welcome', (req, res) => {
    res.send('Hello World!')
  })

  service.start()
})
