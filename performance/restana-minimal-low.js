const low = require('0http/lib/server/low')
const service = require('../index')({
  disableResponseEvent: true,
  prioRequestsProcessing: false,
  server: low()
})

service.get('/hi', (req, res) => {
  res.send('Hello World!')
})

service.start(3000, (socket) => {
  if (socket) {
    console.log('HTTP server running at http://localhost:3000')
  }
})
