'use strict'

const files = require('serve-static')
const path = require('path')

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

app.use(serve)

app.start(3000)
