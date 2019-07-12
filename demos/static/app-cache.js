const files = require('serve-static')
const path = require('path')
const finish = require('finalhandler')

const app = require('../../index')({
  disableResponseEvent: true
})
app.use(require('http-cache-middleware')())

const serve = files(path.join(__dirname, 'src'), {
  lastModified: false,
  setHeaders: (res, path) => {
    res.setHeader('cache-control', 'public, no-cache, max-age=604800')
  }
})

app.use((req, res) => {
  const done = finish(req, res)
  serve(req, res, done)
})

app.start(3000)
