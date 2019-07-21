const cero = require('0http')

const { router, server } = cero()

router.on('GET', '/hi', (req, res) => {
  res.end('Hello World!')
})

server.listen(3000)
