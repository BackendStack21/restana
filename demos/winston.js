const service = require('./../index')({})
const winston = require('winston')

const log = new winston.Logger({
  transports: [
    new winston.transports.Console({
      json: true,
      level: 'info',
      timestamp: true,
      stringify: obj => JSON.stringify(obj)
    })
  ],
  rewriters: [
    (level, msg, meta) => {
      meta.stage = process.env.NODE_ENV || 'dev'
      return meta
    }
  ],
  filters: [
    (level, msg) => {
      msg = msg.replace(/(\r\n|\n|\r)/gm, '')
      return msg
    }
  ]
})

service.get('/v1/welcome', (req, res) => {
  log.info('welcome was requested...', {
    method: req.method
  })
  res.send('Hello World!')
})

service.start()
