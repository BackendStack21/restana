const http = require('http2')

const service = http.createServer()

// backward API compatibility
service.on('request', (req, res) => {
  if (req.method === 'GET' && req.url === '/hi') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('Hello World!')
  } else {
    res.statusCode = 404
    res.end()
  }
})

service.listen(3000)
