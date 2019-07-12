const files = require('serve-static')
const path = require('path')
const finish = require('finalhandler')
const serve = files(path.join(__dirname, 'src'))

const app = require('../../index')({
  disableResponseEvent: true
})

app.use((req, res) => {
  const done = finish(req, res)
  serve(req, res, done)
})

app.start(3000)
