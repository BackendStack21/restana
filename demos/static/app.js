const files = require('serve-static')
const path = require('path')
const serve = files(path.join(__dirname, 'src'))

const app = require('../../index')({
  disableResponseEvent: true
})

app.use(serve)

app.start(3000)
