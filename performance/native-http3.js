'use strict'

const http2 = require('http2')
const pem = require('pem')

pem.createCertificate({
  days: 1,
  selfSigned: true
}, (err, keys) => {
  if (err) console.error(err)

  const service = http2.createSecureServer({
    key: keys.serviceKey,
    cert: keys.certificate
  })

  // streams API example
  service.on('stream', (stream, headers) => {
    if (headers[':path'] === '/hi' && headers[':method'] === 'GET') {
      stream.respond({
        'content-type': 'text/html',
        ':status': 200
      })

      stream.end('Hello World!')
    } else {
      stream.respond({
        ':status': 404
      })
      stream.end()
    }
  })

  service.listen(3000)
})
