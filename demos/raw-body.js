const service = require('./../index')({})
const rawbody = require('raw-body')

service.use(async (req, res, next) => {
  try {
    await rawbody(req, {
      length: req.headers['content-length'],
      limit: '500kb'
    })
  } catch (err) {
    res.statusCode = 400
    res.statusMessage = err.message
  }
  next()
})

service.post('/upload', (req, res) => {
  // ... manage file upload

  res.send()
})

service.start()
